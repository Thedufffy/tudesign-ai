import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWithOpenAI(file: File, prompts: string[]) {
  const results: string[] = [];

  for (const prompt of prompts) {
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt,
      size: "1024x1024",
    });

    const base64 = response.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error("OpenAI görsel sonucu üretmedi.");
    }

    results.push(`data:image/png;base64,${base64}`);
  }

  return results;
}