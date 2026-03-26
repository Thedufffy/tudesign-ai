import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { image, type, style, note } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Görsel bulunamadı." },
        { status: 400 }
      );
    }

    const prompt = `
Ultra photorealistic interior render.

Task: ${type}
Style: ${style}

Extra notes:
${note || "none"}

Enhance this design to a FINAL PREMIUM VERSION.

Add:
- cinematic lighting
- global illumination feel
- micro imperfections
- realistic materials
- depth of field
- lens imperfections

Make it look like a high-end architectural render.
NOT AI generated look.
`;

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image,
      prompt,
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    return NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error: any) {
    console.error("FINAL ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Final üretim hatası" },
      { status: 500 }
    );
  }
}