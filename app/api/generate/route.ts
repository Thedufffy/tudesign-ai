import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Mode = "retouch" | "redesign";

function buildPrompt(
  mode: Mode,
  style: string,
  note: string,
  variation: number
) {
  const retouchVariationText = [
    "Keep the enhancement balanced, elegant, and highly realistic.",
    "Keep the same design but add slightly stronger styling, lighting contrast, and material richness.",
    "Keep the same design with a softer, calmer, more refined and atmospheric finish.",
  ][variation] || "Create a refined and photorealistic retouch.";

  const redesignVariationText = [
    "Create a balanced and elegant redesign.",
    "Create a slightly bolder and more characterful redesign.",
    "Create a softer, calmer, more refined redesign.",
  ][variation] || "Create a high-quality redesign.";

  if (mode === "retouch") {
    return `
Retouch this interior image.

Style: ${style}
Extra: ${note || "No extra note provided."}

IMPORTANT:
- Keep the same room layout
- Keep the same camera angle
- Keep the same furniture layout as much as possible
- Preserve the architectural proportions
- Do not redesign the space from scratch
- Do not change the core concept of the room
- Improve lighting, materials, texture realism, decoration balance, and atmosphere
- Make the result more photorealistic
- Keep the image premium, elegant, and believable

Variation direction:
${retouchVariationText}
`;
  }

  return `
Redesign this interior space.

Style: ${style}
Extra: ${note || "No extra note provided."}

IMPORTANT:
- Keep the same room layout
- Keep the same camera angle
- Preserve the architectural proportions
- Redesign materials, furniture language, color palette, styling, and atmosphere
- Create a new interior design interpretation based on the selected style
- Make it photorealistic
- Produce a premium interior design result

Variation direction:
${redesignVariationText}
`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const style = String(formData.get("style") || "Modern");
    const note = String(formData.get("note") || "");
    const rawMode = String(formData.get("mode") || "retouch");

    const mode: Mode = rawMode === "redesign" ? "redesign" : "retouch";

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Geçerli bir görsel bulunamadı." },
        { status: 400 }
      );
    }

    const prompts = [
      buildPrompt(mode, style, note, 0),
      buildPrompt(mode, style, note, 1),
      buildPrompt(mode, style, note, 2),
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