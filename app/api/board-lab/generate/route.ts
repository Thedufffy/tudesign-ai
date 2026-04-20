// app/api/board-lab/generate/route.ts

import { NextResponse } from "next/server";
import type { BoardLabAnalysis, BoardLabGenerateResponse } from "@/lib/board-lab/board-types";
import { fileToDataUrl, safeProjectTitle, normalizeStringArray, normalizeColorPalette, fallbackAnalysis } from "@/lib/board-lab/board-utils";
import { createDetailCropsFromDataUrl } from "@/lib/board-lab/image-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParseAnalysis(
  raw: FormDataEntryValue | null,
  projectTitle: string
): BoardLabAnalysis {
  if (typeof raw !== "string" || !raw.trim()) {
    return fallbackAnalysis(projectTitle);
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      projectTitle,
      spaceType:
        typeof parsed?.spaceType === "string" && parsed.spaceType.trim()
          ? parsed.spaceType.trim()
          : "unknown",
      conceptText:
        typeof parsed?.conceptText === "string" && parsed.conceptText.trim()
          ? parsed.conceptText.trim()
          : fallbackAnalysis(projectTitle).conceptText,
      functionText: normalizeStringArray(
        parsed?.functionText,
        fallbackAnalysis(projectTitle).functionText
      ).slice(0, 5),
      materialPalette: normalizeStringArray(
        parsed?.materialPalette,
        fallbackAnalysis(projectTitle).materialPalette
      ).slice(0, 6),
      colorPalette: normalizeColorPalette(parsed?.colorPalette),
      detailNotes: normalizeStringArray(
        parsed?.detailNotes,
        fallbackAnalysis(projectTitle).detailNotes
      ).slice(0, 5),
    };
  } catch {
    return fallbackAnalysis(projectTitle);
  }
}

async function buildBoardData(params: {
  projectTitle: string;
  mainImage: string;
  analysis: BoardLabAnalysis;
}): Promise<BoardLabGenerateResponse> {
  const { projectTitle, mainImage, analysis } = params;

  const detailImages = await createDetailCropsFromDataUrl({
    imageDataUrl: mainImage,
  });

  return {
    projectTitle,
    sheetTitle: `${projectTitle} / Detay Paftası`,
    mainImage,
    detailImages: detailImages.map((item) => item.src),
    conceptText: analysis.conceptText,
    functionText: analysis.functionText,
    detailNotes: analysis.detailNotes,
    materialPalette: analysis.materialPalette,
    colorPalette: analysis.colorPalette,
    spaceType: analysis.spaceType,
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

    const mainImage = await fileToDataUrl(file);
    const analysis = safeParseAnalysis(formData.get("analysis"), projectTitle);

    const boardData = await buildBoardData({
      projectTitle,
      mainImage,
      analysis,
    });

    return NextResponse.json({
      success: true,
      boardData,
    });
  } catch (error) {
    console.error("board-lab generate error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Detay paftası oluşturulurken bilinmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}