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

function isValidImageFile(file: File) {
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp"
  );
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

    const file = formData.get("file");
    const country = String(formData.get("country") || "").trim();
    const promptText = String(formData.get("prompt") || "").trim();

    if (!(file instanceof File) || !country || !promptText) {
      return NextResponse.json({ error: "Eksik veri." }, { status: 400 });
    }

    if (!isValidImageFile(file)) {
      return NextResponse.json(
        { error: "Sadece PNG, JPG veya WEBP yükleyebilirsiniz." },
        { status: 400 }
      );
    }

    const creditResult = decrementCredit(userId, 1);

    if (!creditResult.ok) {
      return NextResponse.json(
        { error: "Krediniz yetersiz." },
        { status: 402 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const imageFile = new File(
      [new Uint8Array(buffer)],
      file.name || "upload.png",
      {
        type: file.type || "image/png",
      }
    );

    const prompt = buildPrompt(country, promptText);

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 3,
      size: "1024x1024",
    });

    const images =
      result.data?.flatMap((img) =>
        img.b64_json ? [`data:image/png;base64,${img.b64_json}`] : []
      ) || [];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "AI görsel üretti ama çıktı alınamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images,
      remainingCredits: creditResult.credits,
    });
  } catch (error: any) {
    console.error("Generate route error full:", error);
    console.error("Generate route error message:", error?.message);
    console.error("Generate route error response:", error?.response?.data);

    return NextResponse.json(
      { error: error?.message || "AI üretim hatası." },
      { status: 500 }
    );
  }
}