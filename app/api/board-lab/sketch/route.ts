// app/api/board-lab/sketch/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { fileToDataUrl, safeProjectTitle } from "@/lib/board-lab/board-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type SketchApiResponse = {
  success: boolean;
  sketchImage?: string | null;
  error?: string;
};

async function generateSketchFromImage(params: {
  imageDataUrl: string;
  projectTitle: string;
}): Promise<string | null> {
  const { imageDataUrl, projectTitle } = params;

  if (!openai) {
    return null;
  }

  const prompt = `
Create a refined architectural presentation sketch from the provided reference image.

Rules:
- Preserve the exact same composition
- Preserve the same camera angle and framing
- Preserve the same layout, proportions, and architectural elements
- Do not redesign the project
- Do not add or remove furniture or architectural objects
- Convert the image into a monochrome architectural sketch
- Use black, white, and soft gray tones only
- Keep it elegant, minimal, and premium
- Fine architectural linework is welcome
- Light shading is allowed
- No text
- No labels
- No watermark
- No border

Project title: ${projectTitle}
`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      size: "1536x1024",
      prompt: `${prompt}\n\nReference image:\n${imageDataUrl}`,
    });

    const imageBase64 = response.data?.[0]?.b64_json;

    if (!imageBase64) {
      return null;
    }

    return `data:image/png;base64,${imageBase64}`;
  } catch (error) {
    console.error("board-lab sketch generate error:", error);
    return null;
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

    const imageDataUrl = await fileToDataUrl(file);

    const sketchImage = await generateSketchFromImage({
      imageDataUrl,
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