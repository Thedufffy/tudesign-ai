import { z } from "zod";

export const UPLOAD_KEYS = [
  "topwear",
  "bottomwear",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "jewelry",
] as const;

export type UploadKey = (typeof UPLOAD_KEYS)[number];

export type UploadedItem = {
  key: UploadKey;
  labelTr: string;
  labelEn: string;
  file: File;
  mimeType: string;
  fileName: string;
};

export type AnalyzedItem = {
  key: UploadKey;
  labelTr: string;
  labelEn: string;
  fileName: string;
  detectedType?: string;
  detectedColor?: string;
  detectedMaterial?: string;
  mustAppearOnModel: boolean;
  mustBeClearlyVisible: boolean;
  usageRuleTr: string;
  usageRuleEn: string;
};

export type OutfitRule = {
  useDressAsPrimary: boolean;
  useTopBottomAsPrimary: boolean;
  allowOuterwearLayer: boolean;
  requireShoesVisible: boolean;
  requireBagVisible: boolean;
  requireJewelryVisible: boolean;
};

export type FashionAnalysis = {
  items: AnalyzedItem[];
  outfitRule: OutfitRule;
  summaryTr: string;
  summaryEn: string;
};

const GeminiAnalysisSchema = z.object({
  items: z.array(
    z.object({
      key: z.enum(UPLOAD_KEYS),
      detectedType: z.string().optional().default(""),
      detectedColor: z.string().optional().default(""),
      detectedMaterial: z.string().optional().default(""),
      notesTr: z.string().optional().default(""),
      notesEn: z.string().optional().default(""),
    })
  ),
});

type GeminiAnalysisResult = z.infer<typeof GeminiAnalysisSchema>;

export const CATEGORY_META: Record<
  UploadKey,
  {
    tr: string;
    en: string;
    mustAppearOnModel: boolean;
    mustBeClearlyVisible: boolean;
    usageRuleTr: string;
    usageRuleEn: string;
  }
> = {
  topwear: {
    tr: "Üst Giyim",
    en: "Topwear",
    mustAppearOnModel: true,
    mustBeClearlyVisible: true,
    usageRuleTr: "Modelin üzerinde ana üst parça olarak birebir görünmeli.",
    usageRuleEn: "Must appear on the model as the main top exactly as uploaded.",
  },
  bottomwear: {
    tr: "Alt Giyim",
    en: "Bottomwear",
    mustAppearOnModel: true,
    mustBeClearlyVisible: true,
    usageRuleTr: "Modelin üzerinde ana alt parça olarak birebir görünmeli.",
    usageRuleEn: "Must appear on the model as the main bottom exactly as uploaded.",
  },
  dress: {
    tr: "Elbise",
    en: "Dress",
    mustAppearOnModel: true,
    mustBeClearlyVisible: true,
    usageRuleTr: "Modelin üzerinde ana look olarak birebir görünmeli.",
    usageRuleEn: "Must appear on the model as the main dress exactly as uploaded.",
  },
  outerwear: {
    tr: "Dış Giyim",
    en: "Outerwear",
    mustAppearOnModel: true,
    mustBeClearlyVisible: true,
    usageRuleTr: "Modelin üzerinde dış katman olarak görünmeli ve kaybolmamalı.",
    usageRuleEn: "Must appear on the model as an outer layer and remain visible.",
  },
  shoes: {
    tr: "Ayakkabı",
    en: "Shoes",
    mustAppearOnModel: true,
    mustBeClearlyVisible: true,
    usageRuleTr: "Ayakta net görünmeli, crop ile kesilmemeli.",
    usageRuleEn: "Must be visible on the feet and must not be cropped out.",
  },
  bag: {
    tr: "Çanta",
    en: "Bag",
    mustAppearOnModel: false,
    mustBeClearlyVisible: true,
    usageRuleTr: "Elde veya omuzda net şekilde görünmeli ve birebir korunmalı.",
    usageRuleEn: "Must be clearly visible in hand or on shoulder and preserved exactly.",
  },
  jewelry: {
    tr: "Takı",
    en: "Jewelry",
    mustAppearOnModel: false,
    mustBeClearlyVisible: true,
    usageRuleTr: "Takı görünür şekilde yer almalı ve birebir korunmalı.",
    usageRuleEn: "Jewelry must be visible and preserved exactly.",
  },
};

export function collectUploadedItems(formData: FormData): UploadedItem[] {
  const items: UploadedItem[] = [];

  for (const key of UPLOAD_KEYS) {
    const value = formData.get(key);

    if (!(value instanceof File)) continue;
    if (!value.size) continue;

    items.push({
      key,
      labelTr: CATEGORY_META[key].tr,
      labelEn: CATEGORY_META[key].en,
      file: value,
      mimeType: value.type || "image/png",
      fileName: value.name || `${key}.png`,
    });
  }

  return items;
}

async function fileToBase64(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

function stripCodeFences(input: string) {
  return input
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function analyzeWithGemini(
  items: UploadedItem[]
): Promise<GeminiAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || items.length === 0) return null;

  const model = process.env.GEMINI_ANALYZE_MODEL || "gemini-2.5-flash";

  const prompt = `
You are analyzing uploaded fashion product images for a production fashion pipeline.

Return ONLY valid JSON.
No markdown.
No explanation.

Schema:
{
  "items": [
    {
      "key": "topwear|bottomwear|dress|outerwear|shoes|bag|jewelry",
      "detectedType": "short specific fashion label",
      "detectedColor": "short color description",
      "detectedMaterial": "short material description",
      "notesTr": "very short Turkish note",
      "notesEn": "very short English note"
    }
  ]
}

Rules:
- One object per uploaded image.
- Respect the provided key for each image.
- Detect visually obvious type, color, and material only.
- Keep answers concise.
`;

  const parts: any[] = [{ text: prompt }];

  for (const item of items) {
    parts.push({
      text: `Image key: ${item.key}, fileName: ${item.fileName}`,
    });

    parts.push({
      inline_data: {
        mime_type: item.mimeType,
        data: await fileToBase64(item.file),
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Gemini analyze failed:", text);
    return null;
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) return null;

  try {
    const parsed = JSON.parse(stripCodeFences(text));
    return GeminiAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("Gemini parse failed:", error, text);
    return null;
  }
}

export async function analyzeUploadedItems(
  items: UploadedItem[]
): Promise<FashionAnalysis> {
  const gemini = await analyzeWithGemini(items);

  const hasDress = items.some((item) => item.key === "dress");
  const hasTopwear = items.some((item) => item.key === "topwear");
  const hasBottomwear = items.some((item) => item.key === "bottomwear");
  const hasOuterwear = items.some((item) => item.key === "outerwear");
  const hasShoes = items.some((item) => item.key === "shoes");
  const hasBag = items.some((item) => item.key === "bag");
  const hasJewelry = items.some((item) => item.key === "jewelry");

  const geminiMap = new Map(
    (gemini?.items ?? []).map((item) => [item.key, item])
  );

  const analyzedItems: AnalyzedItem[] = items.map((item) => {
    const ai = geminiMap.get(item.key);

    return {
      key: item.key,
      labelTr: item.labelTr,
      labelEn: item.labelEn,
      fileName: item.fileName,
      detectedType: ai?.detectedType || "",
      detectedColor: ai?.detectedColor || "",
      detectedMaterial: ai?.detectedMaterial || "",
      mustAppearOnModel: CATEGORY_META[item.key].mustAppearOnModel,
      mustBeClearlyVisible: CATEGORY_META[item.key].mustBeClearlyVisible,
      usageRuleTr: CATEGORY_META[item.key].usageRuleTr,
      usageRuleEn: CATEGORY_META[item.key].usageRuleEn,
    };
  });

  const outfitRule: OutfitRule = {
    useDressAsPrimary: hasDress,
    useTopBottomAsPrimary: !hasDress && hasTopwear && hasBottomwear,
    allowOuterwearLayer: hasOuterwear,
    requireShoesVisible: hasShoes,
    requireBagVisible: hasBag,
    requireJewelryVisible: hasJewelry,
  };

  let summaryTr = "Yüklenen ürünler birlikte korunmalı.";
  if (outfitRule.useDressAsPrimary) {
    summaryTr =
      "Elbise ana parça olarak kullanılmalı. Çakışan ekstra üst/alt giyim üretilmemeli.";
  } else if (outfitRule.useTopBottomAsPrimary) {
    summaryTr =
      "Üst giyim ve alt giyim ana kombin olarak birlikte korunmalı.";
  }

  if (outfitRule.allowOuterwearLayer) summaryTr += " Dış giyim görünür bir katman olarak eklenmeli.";
  if (outfitRule.requireShoesVisible) summaryTr += " Ayakkabılar tam görünmeli.";
  if (outfitRule.requireBagVisible) summaryTr += " Çanta net görünmeli.";
  if (outfitRule.requireJewelryVisible) summaryTr += " Takı görünür olmalı.";

  let summaryEn = "All uploaded items must be preserved together.";
  if (outfitRule.useDressAsPrimary) {
    summaryEn =
      "Dress must be the primary look. Do not invent conflicting extra topwear or bottomwear.";
  } else if (outfitRule.useTopBottomAsPrimary) {
    summaryEn =
      "Topwear and bottomwear must be preserved together as the primary outfit.";
  }

  if (outfitRule.allowOuterwearLayer) summaryEn += " Outerwear should remain visible as a layer.";
  if (outfitRule.requireShoesVisible) summaryEn += " Shoes must be fully visible.";
  if (outfitRule.requireBagVisible) summaryEn += " Bag must be clearly visible.";
  if (outfitRule.requireJewelryVisible) summaryEn += " Jewelry must remain visible.";

  return {
    items: analyzedItems,
    outfitRule,
    summaryTr,
    summaryEn,
  };
}