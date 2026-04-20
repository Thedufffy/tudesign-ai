// app/api/board-lab/sketch/route.ts

import { NextResponse } from "next/server";
import { safeProjectTitle } from "@/lib/board-lab/board-utils";
import { generateBoardLabSketch } from "@/lib/board-lab/sketch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SketchApiResponse = {
  success: boolean;
  sketchImage?: string | null;
  error?: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const projectNameRaw = String(formData.get("projectName") || "");
    const projectTitle = safeProjectTitle(projectNameRaw);

    const file = image instanceof File ? image : null;

    if (!file) {
      return NextResponse.json<SketchApiResponse>(
        {
          success: false,
          error: "Görsel bulunamadı.",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json<SketchApiResponse>(
        {
          success: false,
          error: "Yüklenen dosya bir görsel olmalı.",
        },
        { status: 400 }
      );
    }

    const sketchImage = await generateBoardLabSketch({
      imageFile: file,
      projectTitle,
    });

    return NextResponse.json<SketchApiResponse>({
      success: true,
      sketchImage: sketchImage || null,
    });
  } catch (error) {
    console.error("board-lab sketch route error:", error);

    return NextResponse.json<SketchApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Sketch oluşturulurken bilinmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}