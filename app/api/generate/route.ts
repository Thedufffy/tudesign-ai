import { NextResponse } from "next/server";
import OpenAI from "openai";

type Engine = "gemini" | "chatgpt" | "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function getEngineName(engine: Engine) {
  if (engine === "gemini") return "GearRenderEngineV1 çalışıyor";
  if (engine === "chatgpt") return "ChargeRenderEngineV1 çalışıyor";
  return "OnixRenderEngineV1 çalışıyor";
}

function normalizeEngine(value: FormDataEntryValue | null): Engine {
  const raw = String(value || "openai").toLowerCase();

  if (raw === "gemini") return "gemini";
  if (raw === "chatgpt") return "chatgpt";
  return "openai";
}

function buildPrompt(userPrompt: string) {
  const cleaned = userPrompt.trim();

  if (cleaned) {
    return [
      "Edit this uploaded interior render.",
      "Apply only the requested revisions.",
      "Do not redesign unrelated areas.",
      "Preserve the existing layout, camera angle, framing, proportions, and all areas not explicitly mentioned.",
      "Keep the result photorealistic, premium, and clean.",
      "",
      "Requested revision:",
      cleaned,
    ].join("\n");
  }

  return [
    "Edit this uploaded interior render.",
    "Keep the same layout, camera angle, framing, and proportions.",
    "Make only subtle, photorealistic improvements.",
    "Do not redesign unrelated areas.",
  ].join("\n");
}

async function runGeminiEdit(image: File, prompt: string) {
  const buffer = Buffer.from(await image.arrayBuffer());

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${
      process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"
    }:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: image.type || "image/png",
                  data: buffer.toString("base64"),
                },
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Gemini üretim isteği başarısız oldu."
    );
  }

  const imagePart = data?.candidates?.[0]?.content?.parts?.find(
    (part: any) => part?.inlineData?.data
  );

  const base64 = imagePart?.inlineData?.data;

  if (!base64) {
    throw new Error("Gemini görsel çıktısı dönmedi.");
  }

  return base64;
}

async function runOpenAIEdit(
  image: File,
  prompt: string,
  model: "gpt-image-1" | "chatgpt-image-latest"
) {
  const buffer = Buffer.from(await image.arrayBuffer());

  const result = await openai.images.edit({
    model,
    image: new File([buffer], image.name || "input.png", {
      type: image.type || "image/png",
    }),
    prompt,
    size: "1024x1024",
  });

  const base64 = result.data?.[0]?.b64_json;

  if (!base64) {
    throw new Error("OpenAI görsel çıktısı dönmedi.");
  }

  return base64;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const image = formData.get("image");
    const prompt = String(formData.get("prompt") || "");
    const engine = normalizeEngine(formData.get("engine"));

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Görsel yok." },
        { status: 400 }
      );
    }

    const finalPrompt = buildPrompt(prompt);

    let resultBase64 = "";

    if (engine === "gemini") {
      resultBase64 = await runGeminiEdit(image, finalPrompt);
    } else if (engine === "chatgpt") {
      resultBase64 = await runOpenAIEdit(
        image,
        finalPrompt,
        "chatgpt-image-latest"
      );
    } else {
      resultBase64 = await runOpenAIEdit(image, finalPrompt, "gpt-image-1");
    }

    return NextResponse.json({
      success: true,
      image: resultBase64,
      engineName: getEngineName(engine),
      engine,
    });
  } catch (error: any) {
    console.error("generate route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Üretim hatası",
      },
      { status: 500 }
    );
  }
}