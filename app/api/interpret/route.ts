// app/api/interpret/route.ts

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

function detectSpaceType(prompt: string): "interior" | "exterior" | "unknown" {
  if (
    includesAny(prompt, [
      "salon",
      "oturma odası",
      "yatak odası",
      "banyo",
      "wc",
      "mutfak",
      "duş",
      "lavabo",
      "niş",
      "koridor",
      "iç mekan",
      "interior",
    ])
  ) {
    return "interior";
  }

  if (
    includesAny(prompt, [
      "cephe",
      "bahçe",
      "teras",
      "dış mekan",
      "exterior",
      "avlu",
      "giriş cephesi",
      "peyzaj",
    ])
  ) {
    return "exterior";
  }

  return "unknown";
}

function detectReferenceIntent(prompt: string) {
  const hasReferenceWord = includesAny(prompt, [
    "referans",
    "bu görseldeki",
    "bu resimdeki",
    "bu fotoğraftaki",
    "ikinci görseldeki",
    "yüklediğim görseldeki",
    "referans görseldeki",
  ]);

  const hasTransferWord = includesAny(prompt, [
    "uygula",
    "aktar",
    "kullan",
    "taşı",
    "al",
    "esinlen",
    "yansıt",
  ]);

  const hasMaterialWord = includesAny(prompt, [
    "malzeme",
    "materyal",
    "doku",
    "renk",
    "taş",
    "çini",
    "seramik",
    "mermer",
    "ahşap",
    "metal",
    "kaplama",
    "parke",
    "kumaş",
    "desen",
    "ton",
    "yüzey",
    "texture",
  ]);

  return {
    isReferenceDriven:
      (hasReferenceWord && hasTransferWord) ||
      (hasReferenceWord && hasMaterialWord),
  };
}

function buildPreserveList(prompt: string) {
  const preserve: string[] = ["Genel mekan kurgusunu koru"];

  if (
    !includesAny(prompt, ["ışık", "aydınlatma", "spot", "parlaklık", "karanlık"])
  ) {
    preserve.push("Mevcut ışık ve aydınlatma dengesini koru");
  }

  if (
    !includesAny(prompt, ["kamera", "açı", "kadraj", "perspektif", "zoom"])
  ) {
    preserve.push("Mevcut kamera açısını ve kadrajı koru");
  }

  if (!includesAny(prompt, ["yerleşim", "mobilya", "konum", "taşı", "taşınsın"])) {
    preserve.push("Mobilya ve ana yerleşim kurgusunu koru");
  }

  if (!includesAny(prompt, ["malzeme", "doku", "materyal", "kaplama", "renk"])) {
    preserve.push("İstenmeyen malzeme ve doku değişiklikleri yapma");
  }

  return preserve;
}

function buildQuestions(prompt: string) {
  const questions: string[] = [];

  if (
    prompt.includes("renk") &&
    !includesAny(prompt, [
      "duvar",
      "zemin",
      "tavan",
      "kapı",
      "dolap",
      "tezgah",
      "lavabo",
      "niş",
      "duş",
      "kolon",
      "tüm alan",
      "genel",
    ])
  ) {
    questions.push("Renk değişikliğinin uygulanacağı yüzeyi netleştirmek ister misin?");
  }

  if (
    includesAny(prompt, ["pembe", "bordo", "vişne", "somon", "bej", "gri", "antrasit"]) &&
    !includesAny(prompt, [
      "duvar",
      "zemin",
      "tavan",
      "dolap",
      "kapı",
      "duş",
      "tezgah",
      "banko",
      "niş",
    ])
  ) {
    questions.push("Belirttiğin tonu hangi alanda görmek istediğini netleştirebilir misin?");
  }

  if (
    prompt.includes("seramik") &&
    !includesAny(prompt, ["zemin", "duvar", "duş", "niş", "tezgah arkası"])
  ) {
    questions.push("Seramik değişikliğinin zemin mi duvar mı olduğunu netleştirmek ister misin?");
  }

  if (
    includesAny(prompt, ["referans", "bu görseldeki", "bu resimdeki", "ikinci görseldeki"]) &&
    !includesAny(prompt, [
      "zemin",
      "duvar",
      "tavan",
      "tezgah",
      "banko",
      "niş",
      "duş duvarı",
      "lavabo arkası",
      "kapı",
      "dolap",
      "kolon",
    ])
  ) {
    questions.push("Referans görseldeki etkinin hangi yüzeye uygulanacağını netleştirmek ister misin?");
  }

  return questions;
}

function splitPromptLines(prompt: string) {
  return prompt
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectTarget(line: string) {
  if (includesAny(line, ["zemin", "parke", "floor"])) return "zemin";
  if (includesAny(line, ["duvar", "wall"])) return "duvar";
  if (includesAny(line, ["tavan", "ceiling"])) return "tavan";
  if (includesAny(line, ["kapı"])) return "kapı";
  if (includesAny(line, ["dolap", "dolabı"])) return "dolap";
  if (includesAny(line, ["tezgah", "banko"])) return "tezgah_banko";
  if (includesAny(line, ["lavabo"])) return "lavabo";
  if (includesAny(line, ["duş"])) return "duş";
  if (includesAny(line, ["niş"])) return "niş";
  if (includesAny(line, ["tv ünitesi", "tv unitesi"])) return "tv_unitesi";
  if (includesAny(line, ["koltuk"])) return "koltuk";
  return "requested_area";
}

function detectAction(line: string) {
  if (includesAny(line, ["ekle", "eklensin", "ilave"])) return "add";
  if (includesAny(line, ["kaldır", "iptal", "sil", "olmasın"])) return "remove";
  if (includesAny(line, ["değiştir", "yenile", "revize"])) return "revise";
  if (includesAny(line, ["uygula", "aktar", "kullan", "yansıt"])) return "apply_reference";
  if (includesAny(line, ["koru", "aynı kalsın", "bozma"])) return "preserve";
  return "revise";
}

function buildChanges(prompt: string): InterpretedChange[] {
  const lines = splitPromptLines(prompt);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line) => ({
    target: detectTarget(line.toLowerCase()),
    action: detectAction(line.toLowerCase()),
    value: line,
  }));
}

function buildSummary(
  originalPrompt: string,
  loweredPrompt: string,
  referenceDriven: boolean
) {
  const compact = originalPrompt.replace(/\s+/g, " ").trim();

  if (referenceDriven) {
    return `Referans görseldeki malzeme / renk / doku etkisini yalnızca kullanıcı tarafından belirtilen yüzeylerde uygula. Ana mekanın kamera açısını, kompozisyonunu, ölçeğini ve genel kurgusunu koru. Kullanıcı talebi: ${compact}`;
  }

  if (
    includesAny(loweredPrompt, [
      "aynı kalsın",
      "bozmadan",
      "koru",
      "dokunma",
      "haricinde",
      "geri kalan",
    ])
  ) {
    return `Yalnızca kullanıcı tarafından açıkça istenen revizeleri uygula. Belirtilmeyen alanlarda mevcut mekan kurgusunu, açıyı, kadrajı ve genel tasarım kararlarını koru. Kullanıcı talebi: ${compact}`;
  }

  return compact;
}

function buildStyleIntent(loweredPrompt: string, referenceDriven: boolean) {
  if (referenceDriven) {
    return "Referans görselden yalnızca gerekli malzeme, renk, desen ve doku karakterini al; sahneyi yeniden tasarlama, yalnızca istenen yüzeylere kontrollü şekilde uygula.";
  }

  if (includesAny(loweredPrompt, ["lüks", "premium", "elegan", "şık"])) {
    return "Premium, dengeli ve gerçekçi bir sonuç üret; yalnızca istenen revizeleri uygula.";
  }

  if (includesAny(loweredPrompt, ["minimal", "sade"])) {
    return "Sade, dengeli ve temiz bir sonuç üret; yalnızca istenen revizeleri uygula.";
  }

  return "Yalnızca istenen revizeleri uygula, belirtilmeyen mekan kararlarını koru.";
}

function buildConstraints(
  loweredPrompt: string,
  referenceDriven: boolean
): string[] {
  const constraints = [
    "Ana mekan kompozisyonunu bozma",
    "Belirtilmeyen alanlarda gereksiz değişiklik yapma",
    "Ölçek ve perspektifi koru",
    "Yapay ve dengesiz malzeme geçişlerinden kaçın",
  ];

  if (referenceDriven) {
    constraints.push(
      "Referans görseli sahnenin tamamına kopyalama",
      "Referans görselden yalnızca istenen yüzey etkisini aktar"
    );
  }

  if (
    includesAny(loweredPrompt, [
      "aynı kalsın",
      "bozmadan",
      "haricinde",
      "geri kalan",
    ])
  ) {
    constraints.push("Geri kalan tüm alanları mümkün olduğunca sabit tut");
  }

  return constraints;
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
    const referenceIntent = detectReferenceIntent(lowered);

    const preserve = buildPreserveList(lowered);
    const missingQuestions = buildQuestions(lowered);
    const changes = buildChanges(prompt);

    const interpreted: InterpretedResult = {
      summary_tr: buildSummary(prompt, lowered, referenceIntent.isReferenceDriven),
      task_type: "render_edit",
      space_type: detectSpaceType(lowered),
      style_intent: buildStyleIntent(lowered, referenceIntent.isReferenceDriven),
      preserve,
      changes,
      constraints: buildConstraints(lowered, referenceIntent.isReferenceDriven),
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