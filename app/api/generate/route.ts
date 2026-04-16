import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const image = formData.get("image") as File;
    const prompt = String(formData.get("prompt") || "");
    const engine = String(formData.get("engine") || "openai"); // 🔥 önemli

    if (!image) {
      return NextResponse.json({ error: "Görsel yok" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    let resultBase64 = "";
    let engineName = "";

    // 🟣 GEMINI
    if (engine === "gemini") {
      engineName = "GearRenderEngineV1 çalışıyor";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_IMAGE_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: image.type,
                      data: buffer.toString("base64"),
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();

      resultBase64 =
        data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)
          ?.inlineData?.data || "";
    }

    // 🔵 OPENAI
    if (engine === "openai") {
      engineName = "OnixRenderEngineV1 çalışıyor";

      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: new File([buffer], "input.png", { type: image.type }),
        prompt,
        size: "1024x1024",
      });

      resultBase64 = result.data?.[0]?.b64_json || "";
    }

    // 🟡 CHATGPT (aynı OpenAI ama farklı label)
    if (engine === "chatgpt") {
      engineName = "ChargeRenderEngineV1 çalışıyor";

      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: new File([buffer], "input.png", { type: image.type }),
        prompt,
        size: "1024x1024",
      });

      resultBase64 = result.data?.[0]?.b64_json || "";
    }

    return NextResponse.json({
      success: true,
      image: resultBase64,
      engineName, // 🔥 FRONTEND BURAYI GÖSTERECEK
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Üretim hatası" },
      { status: 500 }
    );
  }
}