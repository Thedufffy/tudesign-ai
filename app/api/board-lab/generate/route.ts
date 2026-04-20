// app/api/board-lab/generate/route.ts

import { NextResponse } from "next/server";
import type {
  BoardLabAnalysis,
  BoardLabGenerateResponse,
} from "@/lib/board-lab/board-types";

import {
  fileToDataUrl,
  safeProjectTitle,
  normalizeStringArray,
  normalizeColorPalette,
  fallbackAnalysis,
} from "@/lib/board-lab/board-utils";

import { createDetailCropsFromDataUrl } from "@/lib/board-lab/image-analysis";
import { generateBoardLabSketch } from "@/lib/board-lab/sketch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParseAnalysis(
  raw: FormDataEntryValue | null,
  projectTitle: string
): BoardLabAnalysis {
  const fallback = fallbackAnalysis(projectTitle);

  if (typeof raw !== "string" || !raw.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      projectTitle,
      spaceType:
        typeof parsed?.spaceType === "string" && parsed.spaceType.trim()
          ? parsed.spaceType.trim()
          : fallback.spaceType,

      conceptText:
        typeof parsed?.conceptText === "string" && parsed.conceptText.trim()
          ? parsed.conceptText.trim()
          : fallback.conceptText,

      functionText: normalizeStringArray(
        parsed?.functionText,
        fallback.functionText
      ).slice(0, 6),

      materialPalette: normalizeStringArray(
        parsed?.materialPalette,
        fallback.materialPalette
      ).slice(0, 8),

      colorPalette: normalizeColorPalette(parsed?.colorPalette),

      detailNotes: normalizeStringArray(
        parsed?.detailNotes,
        fallback.detailNotes
      ).slice(0, 6),
    };
  } catch {
    return fallback;
  }
}

function ensureThreeDetailImages(mainImage: string, detailImages: string[]) {
  const clean = detailImages.filter(Boolean);

  if (clean.length >= 3) return clean.slice(0, 3);
  if (clean.length === 2) return [clean[0], clean[1], mainImage];
  if (clean.length === 1) return [clean[0], mainImage, mainImage];

  return [mainImage, mainImage, mainImage];
}

async function buildBoardData(params: {
  projectTitle: string;
  mainImage: string;
  analysis: BoardLabAnalysis;
}): Promise<BoardLabGenerateResponse> {
  const { projectTitle, mainImage, analysis } = params;
  const fallback = fallbackAnalysis(projectTitle);

  let detailImages: string[] = [];
  let sketchImage: string | null = null;

  // ✅ DETAIL CROPS (asla sistemi kırmaz)
  try {
    const crops = await createDetailCropsFromDataUrl({
      imageDataUrl: mainImage,
    });

    detailImages = crops.map((item) => item.src).filter(Boolean);
  } catch (error) {
    console.error("detail crop error:", error);
  }

  // ✅ SKETCH (kritik: fallback safe)
  try {
    sketchImage = await generateBoardLabSketch({
      imageDataUrl: mainImage,
      projectTitle,
    });
  } catch (error) {
    console.error("sketch error:", error);
  }

  return {
    projectTitle,
    sheetTitle: `${projectTitle} / Detay Paftası`,

    mainImage,

    detailImages: ensureThreeDetailImages(mainImage, detailImages),

    // 🔥 kritik nokta
    sketchImage: sketchImage || mainImage,

    conceptText: analysis.conceptText || fallback.conceptText,

    functionText:
      analysis.functionText?.length > 0
        ? analysis.functionText
        : fallback.functionText,

    detailNotes:
      analysis.detailNotes?.length > 0
        ? analysis.detailNotes
        : fallback.detailNotes,

    materialPalette:
      analysis.materialPalette?.length > 0
        ? analysis.materialPalette
        : fallback.materialPalette,

    colorPalette:
      analysis.colorPalette?.length > 0
        ? analysis.colorPalette
        : fallback.colorPalette,

    spaceType: analysis.spaceType || fallback.spaceType,

    meta: {
      layoutStyle: "premium-presentation-sheet",
      imageMode: "original-protected",
      generatedBy: "tuDesign AI / Board Lab",
    },
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
        { success: false, error: "Görsel bulunamadı." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Dosya görsel olmalı." },
        { status: 400 }
      );
    }

    const mainImage = await fileToDataUrl(file);

    const analysis = safeParseAnalysis(
      formData.get("analysis"),
      projectTitle
    );

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
            : "Pafta oluşturulurken hata oluştu.",
      },
      { status: 500 }
    );
  }
}