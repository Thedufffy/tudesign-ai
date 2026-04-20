// lib/board-lab/sketch.ts

import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateBoardLabSketch(params: {
  imageDataUrl: string;
  projectTitle: string;
}): Promise<string | null> {
  const { imageDataUrl, projectTitle } = params;

  if (!openai) {
    return null;
  }

  const prompt = `
Create a refined architectural presentation sketch from the provided image.

Rules:
- Preserve the exact same composition
- Preserve the same camera angle and framing
- Preserve the same layout, proportions, and architectural elements
- Do not redesign the project
- Do not add or remove furniture or architectural objects
- Convert the image into a monochrome architectural sketch
- Use elegant black, white, and soft gray tones only
- The output should feel premium, minimal, and presentation-board ready
- Fine linework is welcome
- Light shading is allowed
- No text
- No labels
- No watermark
- No border

Project title: ${projectTitle}
`;

  try {
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageDataUrl,
      prompt,
      size: "1536x1024",
    });

    const imageBase64 = response.data?.[0]?.b64_json;

    if (!imageBase64) {
      return null;
    }

    return `data:image/png;base64,${imageBase64}`;
  } catch (error) {
    console.error("generateBoardLabSketch error:", error);
    return null;
  }
}