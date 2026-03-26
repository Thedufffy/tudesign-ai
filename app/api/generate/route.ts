import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildPrompt(style: string, note: string, variation: number) {
  const variationText = [
    "Create a balanced and elegant redesign.",
    "Create a slightly bolder and more characterful redesign.",
    "Create a softer, calmer, more refined redesign.",
  ][variation] || "Create a high-quality redesign.";

  return `
Redesign this interior space.

Style: ${style}
Extra: ${note}

IMPORTANT:
- Keep the same room layout
- Keep the same camera angle
- Preserve the architectural proportions
- Improve materials, lighting, styling, and atmosphere
- Make it photorealistic
- Produce a premium interior design result

Variation direction:
${variationText}
`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const style = String(formData.get("style") || "");
    const note = String(formData.get("note") || "");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Geçerli bir görsel bulunamadı." },
        { status: 400 }
      );
    }

    const prompts = [
      buildPrompt(style, note, 0),
      buildPrompt(style, note, 1),
      buildPrompt(style, note, 2),
    ];

    const results = await Promise.all(
      prompts.map((prompt) =>
        openai.images.edit({
          model: "gpt-image-1",
          image: file,
          prompt,
          size: "1024x1024",
        })
      )
    );

    const images = results
      .map((result) => result.data?.[0]?.b64_json)
      .filter(Boolean)
      .map((b64) => `data:image/png;base64,${b64}`);

    if (!images.length) {
      return Response.json(
        { error: "AI görsel üretemedi." },
        { status: 500 }
      );
    }

    return Response.json({ images });
  } catch (err: any) {
    console.error("AI ERROR:", err);

    const actualMessage =
      err?.error?.message ||
      err?.message ||
      "Bilinmeyen bir hata oluştu.";

    return Response.json({ error: actualMessage }, { status: 500 });
  }
}