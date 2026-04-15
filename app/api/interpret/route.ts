import { NextResponse } from "next/server";

type InterpretedChange = {
  target: string;
  action: string;
  value: string;
};

type InterpretedResult = {
  summary_tr: string;
  task_type: "render_edit";
  space_type: "interior" | "exterior" | "unknown";
  style_intent: string;
  preserve: string[];
  changes: InterpretedChange[];
  constraints: string[];
  missing_questions: string[];
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function buildPreserveList(prompt: string) {
  const preserve: string[] = ["Genel mekan kurgusunu koru"];

  if (!includesAny(prompt, ["ışık", "aydınlatma", "spot", "parlaklık", "karanlık"])) {
    preserve.push("Mevcut ışık ve aydınlatma dengesini koru");
  }

  if (!includesAny(prompt, ["kamera", "açı", "kadraj", "perspektif", "zoom"])) {
    preserve.push("Mevcut kamera açısını ve kadrajı koru");
  }

  if (!includesAny(prompt, ["malzeme", "doku", "materyal"])) {
    preserve.push("İstenmeyen malzeme ve doku değişiklikleri yapma");
  }

  return preserve;
}

function buildQuestions(prompt: string) {
  const questions: string[] = [];

  if (prompt.includes("renk") && !includesAny(prompt, ["duvar", "zemin", "tavan", "kapı", "dolap", "tezgah", "lavabo", "niş", "duş"])) {
    questions.push("Renk değişikliğinin uygulanacağı yüzeyi netleştirmek ister misin?");
  }

  if (includesAny(prompt, ["pembe", "bordo", "vişne", "somon", "bej"]) && !includesAny(prompt, ["duvar", "zemin", "tavan", "dolap", "kapı", "duş"])) {
    questions.push("Belirttiğin tonu hangi alanda görmek istediğini netleştirebilir misin?");
  }

  if (prompt.includes("seramik") && !includesAny(prompt, ["zemin", "duvar", "duş", "niş"])) {
    questions.push("Seramik değişikliğinin zemin mi duvar mı olduğunu netleştirmek ister misin?");
  }

  return questions;
}

function buildChanges(prompt: string): InterpretedChange[] {
  const lines = prompt
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line) => ({
    target: "requested_area",
    action: "revise",
    value: line,
  }));
}

function buildAssistantReply(summary: string, preserve: string[], questions: string[]) {
  const preserveText = preserve.join(", ");

  if (questions.length > 0) {
    return [
      "İsteğini anladım ve yalnızca revize talep ettiğin bölgelere odaklanacağım.",
      "",
      `Revize özeti: ${summary}`,
      "",
      `Belirtmediğin için şu alanları koruyarak ilerleyeceğim: ${preserveText}.`,
      "",
      "Netleştirmek istediğim kısa noktalar var:",
      ...questions.map((q) => `- ${q}`),
      "",
      "İstersen bu haliyle de üretime geçebilirim.",
    ].join("\n");
  }

  return [
    "İsteğini anladım ve yalnızca revize istediğin alanlara odaklanarak ilerleyeceğim.",
    "",
    `Revize özeti: ${summary}`,
    "",
    `Belirtmediğin için şu alanları koruyacağım: ${preserveText}.`,
    "",
    "İstediğin revizeyi oluşturmak için hazırım.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Revize isteği boş olamaz." },
        { status: 400 }
      );
    }

    const lowered = prompt.toLowerCase();

    const preserve = buildPreserveList(lowered);
    const missingQuestions = buildQuestions(lowered);
    const changes = buildChanges(prompt);

    const interpreted: InterpretedResult = {
      summary_tr: prompt,
      task_type: "render_edit",
      space_type: "interior",
      style_intent:
        "Yalnızca istenen revizeleri uygula, belirtilmeyen mekan kararlarını koru.",
      preserve,
      changes,
      constraints: [
        "Ana mekan kompozisyonunu bozma",
        "Belirtilmeyen alanlarda gereksiz değişiklik yapma",
      ],
      missing_questions: missingQuestions,
    };

    const assistantReply = buildAssistantReply(
      interpreted.summary_tr,
      interpreted.preserve,
      interpreted.missing_questions
    );

    return NextResponse.json({
      success: true,
      needsClarification: missingQuestions.length > 0,
      assistantReply,
      interpreted,
    });
  } catch (error) {
    console.error("interpret route error:", error);

    return NextResponse.json(
      { error: "İstek yorumlanamadı." },
      { status: 500 }
    );
  }
}