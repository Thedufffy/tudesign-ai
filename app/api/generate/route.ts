import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import {
  decrementCredit,
  findUserById,
  addFashionGenerationLog,
} from "@/lib/fashion-store";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const image = formData.get("image");
    const prompt =
      typeof formData.get("prompt") === "string"
        ? String(formData.get("prompt"))
        : "";
    const locale =
      typeof formData.get("locale") === "string"
        ? String(formData.get("locale"))
        : undefined;
    const country =
      typeof formData.get("country") === "string"
        ? String(formData.get("country"))
        : undefined;
    const preset =
      typeof formData.get("preset") === "string"
        ? String(formData.get("preset"))
        : undefined;

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Görsel bulunamadı." },
        { status: 400 }
      );
    }

    const userId = await getFashionSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const creditResult = await decrementCredit(userId, 1);

    if (!creditResult.ok) {
      return NextResponse.json(
        { error: "Krediniz yetersiz." },
        { status: 402 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: new File([buffer], image.name || "fashion-input.png", {
        type: image.type || "image/png",
      }),
      prompt:
        prompt ||
        "Create a photorealistic fashion image. Preserve the uploaded product faithfully. Keep colors, form, material, and product details accurate.",
      size: "1024x1024",
    });

    const images =
      result.data?.map((item) => item.b64_json).filter(Boolean) ?? [];

    await addFashionGenerationLog({
      userEmail: user.email,
      creditsUsed: 1,
      resultCount: images.length,
      preset,
      locale,
      country,
      prompt:
        prompt ||
        "Create a photorealistic fashion image. Preserve the uploaded product faithfully. Keep colors, form, material, and product details accurate.",
    });

    return NextResponse.json({
      success: true,
      images,
      creditsLeft: creditResult.user?.credits ?? user.credits - 1,
    });
  } catch (error) {
    console.error("generate route error:", error);

    return NextResponse.json(
      { error: "Görsel üretimi başarısız oldu." },
      { status: 500 }
    );
  }
}