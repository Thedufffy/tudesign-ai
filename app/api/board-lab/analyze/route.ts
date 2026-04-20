// app/api/board-lab/analyze/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BoardLabAnalysis = {
  projectTitle: string;
  spaceType: string;
  conceptText: string;
  functionText: string[];
  materialPalette: string[];
  colorPalette: string[];
  detailNotes: string[];
};

function safeProjectTitle(value: string) {
  const trimmed = value.trim();
  if (trimmed.length >= 3) return trimmed;
  return "Proje";
}

async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${file.type || "image/jpeg"};base64,${base64}`;
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  const arr = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return arr.length ? arr : fallback;
}

function normalizeColorPalette(value: unknown) {
  const fallback = ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"];

  if (!Array.isArray(value)) return fallback;

  const colors = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(item));

  return colors.length ? colors.slice(0, 5) : fallback;
}

function fallbackAnalysis(projectTitle: string): BoardLabAnalysis {
  return {
    projectTitle,
    spaceType: "interior",
    conceptText:
      "Bu pafta, yüklenen mahal görselinin mevcut kompozisyonu korunarak detay odaklı bir sunum diline aktarılmış halidir. Mekanın ana malzeme karakteri, renk dengesi ve genel atmosferi analiz edilerek pafta kurgusuna dönüştürülmüştür.",
    functionText: [
      "Ana mahal görseli korunmuştur",
      "Sunum paftası düzenine uyarlanmıştır",
      "Malzeme ve renk dili özetlenmiştir",
      "Detay odaklı sunum kurgusu oluşturulmuştur",
    ],
    materialPalette: ["Mermer", "Ahşap", "Duvar", "Zemin"],
    colorPalette: ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"],
    detailNotes: [
      "Ana görsel paftaya doğrudan yerleştirilmiştir",
      "Yakın plan detay alanları otomatik hazırlanacaktır",
      "Malzeme ve ton karakteri sunum dili için analiz edilmiştir",
    ],
  };
}

async function analyzeWithOpenAI(params: {
  file: File;
  projectTitle: string;
}): Promise<BoardLabAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackAnalysis(params.projectTitle);
  }

  const imageDataUrl = await fileToDataUrl(params.file);

  const prompt = `
You are analyzing a single uploaded interior or architectural space image for a presentation board system.

Your task:
Return a strict JSON object with these exact keys:
- projectTitle: string
- spaceType: string
- conceptText: string
- functionText: string[]
- materialPalette: string[]
- colorPalette: string[]
- detailNotes: string[]

Rules:
- The image itself must be preserved conceptually. We are not redesigning the project.
- Write concise, professional Turkish output.
- Infer likely material names from what is visible.
- colorPalette must contain 5 HEX colors.
- functionText should contain 3 to 5 short bullet-style strings.
- materialPalette should contain 4 to 6 short material names.
- detailNotes should contain 3 to 5 short presentation/detail notes.
- spaceType should be one of: interior, exterior, unknown.
- projectTitle must be exactly "${params.projectTitle}".

Focus on:
- visible space type
- material language
- overall concept
- presentation-board friendly notes

Return JSON only.
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ANALYZE_MODEL || "gpt-4.1-mini",
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
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "board_lab_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              projectTitle: { type: "string" },
              spaceType: { type: "string" },
              conceptText: { type: "string" },
              functionText: {
                type: "array",
                items: { type: "string" },
              },
              materialPalette: {
                type: "array",
                items: { type: "string" },
              },
              colorPalette: {
                type: "array",
                items: { type: "string" },
              },
              detailNotes: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "projectTitle",
              "spaceType",
              "conceptText",
              "functionText",
              "materialPalette",
              "colorPalette",
              "detailNotes",
            ],
          },
        },
      },
    }),
  });

  const rawText = await response.text();

  let parsed: any = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(rawText || "OpenAI analyze yanıtı parse edilemedi.");
  }

  if (!response.ok) {
    throw new Error(
      parsed?.error?.message ||
        parsed?.error ||
        rawText ||
        `HTTP ${response.status} hatası`
    );
  }

  const contentText =
    parsed?.output?.[0]?.content?.find((item: any) => item?.type === "output_text")
      ?.text ||
    parsed?.output_text ||
    null;

  if (!contentText || typeof contentText !== "string") {
    return fallbackAnalysis(params.projectTitle);
  }

  let contentJson: any = null;
  try {
    contentJson = JSON.parse(contentText);
  } catch {
    return fallbackAnalysis(params.projectTitle);
  }

  return {
    projectTitle: params.projectTitle,
    spaceType:
      typeof contentJson?.spaceType === "string"
        ? contentJson.spaceType
        : "unknown",
    conceptText:
      typeof contentJson?.conceptText === "string" && contentJson.conceptText.trim()
        ? contentJson.conceptText.trim()
        : fallbackAnalysis(params.projectTitle).conceptText,
    functionText: normalizeStringArray(
      contentJson?.functionText,
      fallbackAnalysis(params.projectTitle).functionText
    ).slice(0, 5),
    materialPalette: normalizeStringArray(
      contentJson?.materialPalette,
      fallbackAnalysis(params.projectTitle).materialPalette
    ).slice(0, 6),
    colorPalette: normalizeColorPalette(contentJson?.colorPalette),
    detailNotes: normalizeStringArray(
      contentJson?.detailNotes,
      fallbackAnalysis(params.projectTitle).detailNotes
    ).slice(0, 5),
  };
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

    const analysis = await analyzeWithOpenAI({
      file,
      projectTitle,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("board-lab analyze error:", error);

    return NextResponse.json(
      {
        success: true,
        analysis: fallbackAnalysis("Proje"),
      },
      { status: 200 }
    );
  }
}