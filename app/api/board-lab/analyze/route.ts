// app/api/board-lab/analyze/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { BoardLabAnalysis } from "@/lib/board-lab/board-types";
import {
  fileToDataUrl,
  safeProjectTitle,
  normalizeStringArray,
  normalizeColorPalette,
  fallbackAnalysis,
} from "@/lib/board-lab/board-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function sanitizeAnalysis(raw: any, projectTitle: string): BoardLabAnalysis {
  const fallback = fallbackAnalysis(projectTitle);

  return {
    projectTitle,
    spaceType:
      typeof raw?.spaceType === "string" && raw.spaceType.trim()
        ? raw.spaceType.trim()
        : fallback.spaceType,
    conceptText:
      typeof raw?.conceptText === "string" && raw.conceptText.trim()
        ? raw.conceptText.trim()
        : fallback.conceptText,
    functionText: normalizeStringArray(
      raw?.functionText,
      fallback.functionText
    ).slice(0, 6),
    materialPalette: normalizeStringArray(
      raw?.materialPalette,
      fallback.materialPalette
    ).slice(0, 8),
    colorPalette: normalizeColorPalette(raw?.colorPalette),
    detailNotes: normalizeStringArray(
      raw?.detailNotes,
      fallback.detailNotes
    ).slice(0, 6),
  };
}

async function analyzeWithOpenAI(params: {
  imageDataUrl: string;
  projectTitle: string;
}): Promise<BoardLabAnalysis> {
  const { imageDataUrl, projectTitle } = params;

  if (!openai) {
    return fallbackAnalysis(projectTitle);
  }

  const prompt = `
Sen mimari sunum paftası hazırlığı için çalışan bir analiz sistemisin.

Görev:
Yüklenen iç mekan / mimari görseli analiz et ve aşağıdaki yapıda SADECE geçerli JSON döndür.

Kurallar:
- JSON dışında hiçbir şey yazma
- Türkçe yaz
- Kısa ama profesyonel ol
- Uydurma marka/model verme
- Görselde kesin olmayan şeyi aşırı iddialı yazma
- Renk paletinde mümkünse hex renkler kullan
- functionText ve detailNotes maddeleri kısa olsun
- materialPalette malzeme başlıkları şeklinde olsun

İstenen JSON formatı:
{
  "projectTitle": "${projectTitle}",
  "spaceType": "salon | mutfak | banyo | yatak odası | mağaza | ofis | restoran | unknown",
  "conceptText": "2-4 cümlelik profesyonel analiz",
  "functionText": ["madde 1", "madde 2", "madde 3"],
  "materialPalette": ["Malzeme 1", "Malzeme 2", "Malzeme 3"],
  "colorPalette": ["#xxxxxx", "#xxxxxx", "#xxxxxx", "#xxxxxx", "#xxxxxx"],
  "detailNotes": ["not 1", "not 2", "not 3"]
}

Analizde şunlara odaklan:
- mekan türü
- genel tasarım dili
- malzeme etkisi
- renk dengesi
- sunumda öne çıkarılabilecek detay noktaları
`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
  });

  const text = response.output_text?.trim();

  if (!text) {
    return fallbackAnalysis(projectTitle);
  }

  try {
    const parsed = JSON.parse(text);
    return sanitizeAnalysis(parsed, projectTitle);
  } catch {
    return fallbackAnalysis(projectTitle);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const projectNameRaw = String(formData.get("projectName") || "");
    const projectTitle = safeProjectTitle(projectNameRaw);

    const file = image instanceof File ? image : null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Görsel bulunamadı.",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Yüklenen dosya bir görsel olmalı.",
        },
        { status: 400 }
      );
    }

    const imageDataUrl = await fileToDataUrl(file);

    let analysis: BoardLabAnalysis;

    try {
      analysis = await analyzeWithOpenAI({
        imageDataUrl,
        projectTitle,
      });
    } catch (aiError) {
      console.error("board-lab analyze ai error:", aiError);
      analysis = fallbackAnalysis(projectTitle);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("board-lab analyze error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Görsel analizi sırasında bilinmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}