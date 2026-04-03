import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import { decrementCredit, findUserById } from "@/lib/fashion-store";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildPrompt(country: string, userPrompt: string) {
  return `
Create a realistic fashion model wearing the provided clothing.

IMPORTANT:
- Keep the clothing EXACTLY the same
- Do not change color, shape, or design
- Preserve all garment details

Model:
- Natural human pose
- Fashion photography style

Scene:
- ${country}
- ${userPrompt}
- realistic environment
- cinematic natural lighting

Output:
- ultra realistic
- premium fashion photography
`;
}

export async function POST(req: Request) {
  try {
    const userId = await getFashionSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const user = findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const country = String(formData.get("country") || "");
    const promptText = String(formData.get("prompt") || "");

    if (!file || !country || !promptText) {
      return NextResponse.json(
        { error: "Eksik veri." },
        { status: 400 }
      );
    }

    // kredi kontrol
    const creditResult = decrementCredit(userId, 1);

    if (!creditResult.ok) {
      return NextResponse.json(
        { error: "Krediniz yetersiz." },
        { status: 402 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const prompt = buildPrompt(country, promptText);

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: buffer,
      prompt,
      n: 3,
      size: "1024x1024",
    });

    const images = result.data.map((img) => {
      return `data:image/png;base64,${img.b64_json}`;
    });

    return NextResponse.json({
      success: true,
      images,
      remainingCredits: creditResult.credits,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI üretim hatası." },
      { status: 500 }
    );
  }
}