import type {
  FashionAnalysis,
  UploadedItem,
} from "@/lib/fashion-analyzer";

export type GeneratePayload = {
  locale: string;
  preset: string;
  country: string;
  city: string;
  scene: string;
  background: string;
  modelGender: string;
  modelAge: string;
  modelLook: string;
  pose: string;
  cameraAngle: string;
  styling: string;
  lighting: string;
  advancedMode: boolean;
  preserveProduct: boolean;
  negativePrompt: string;
  extraNotes: string;
  resultCount: number;
};

export function clean(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function boolFromForm(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function numberFromForm(
  value: FormDataEntryValue | null | undefined,
  fallback: number
) {
  const raw = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(raw)) return fallback;
  return raw;
}

export function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

export function getGeneratePayload(
  formData: FormData,
  defaultResultCount = 2,
  maxResultCount = 4
): GeneratePayload {
  const resultCount = clamp(
    numberFromForm(
      formData.get("resultCount") ??
        formData.get("count") ??
        formData.get("variations") ??
        formData.get("n"),
      defaultResultCount
    ),
    1,
    maxResultCount
  );

  return {
    locale: clean(formData.get("locale")) || "tr",
    preset: clean(formData.get("preset")) || "editorial",
    country: clean(formData.get("country")),
    city: clean(formData.get("city")),
    scene:
      clean(formData.get("scene")) ||
      clean(formData.get("prompt")) ||
      clean(formData.get("customPrompt")),
    background:
      clean(formData.get("background")) || clean(formData.get("atmosphere")),
    modelGender: clean(formData.get("modelGender")),
    modelAge: clean(formData.get("modelAge")),
    modelLook: clean(formData.get("modelLook")),
    pose: clean(formData.get("pose")),
    cameraAngle:
      clean(formData.get("cameraAngle")) || clean(formData.get("angle")),
    styling:
      clean(formData.get("styling")) || clean(formData.get("productFocus")),
    lighting: clean(formData.get("lighting")),
    advancedMode: boolFromForm(
      formData.get("advancedMode") ?? formData.get("advanced")
    ),
    preserveProduct: boolFromForm(
      formData.get("preserveProduct") ?? formData.get("productFaithful")
    ),
    negativePrompt: clean(
      formData.get("negativePrompt") ?? formData.get("negative")
    ),
    extraNotes:
      clean(formData.get("extraNotes")) || clean(formData.get("customPrompt")),
    resultCount,
  };
}

export function buildFashionPrompt(
  payload: GeneratePayload,
  analysis: FashionAnalysis,
  uploadedItems: UploadedItem[]
) {
  const isTr = payload.locale.toLowerCase().startsWith("tr");

  const presetMap: Record<string, string> = {
    editorial: isTr
      ? "lüks moda editoryal çekim"
      : "luxury fashion editorial shoot",
    studio: isTr
      ? "temiz premium stüdyo çekimi"
      : "clean premium studio shoot",
    street: isTr
      ? "premium street style moda çekimi"
      : "premium street style fashion shoot",
    campaign: isTr
      ? "global marka kampanya çekimi"
      : "global brand campaign shoot",
    ecommerce: isTr
      ? "yüksek kaliteli e-ticaret moda çekimi"
      : "high-end e-commerce fashion shoot",
    luxury_studio_clean: isTr
      ? "temiz lüks stüdyo moda çekimi"
      : "clean luxury studio fashion shoot",
    editorial_cover_blue: isTr
      ? "kapak kalitesinde editoryal moda çekimi"
      : "cover-quality editorial fashion shoot",
    motion_campaign: isTr
      ? "hareket hissi olan kampanya moda çekimi"
      : "motion-driven fashion campaign shoot",
    sculptural_editorial: isTr
      ? "heykelsi duruşlu editoryal moda çekimi"
      : "sculptural editorial fashion shoot",
    mirror_editorial: isTr
      ? "ayna etkili editoryal moda çekimi"
      : "mirror-based editorial fashion shoot",
    premium_ecommerce: isTr
      ? "premium e-ticaret moda çekimi"
      : "premium e-commerce fashion shoot",
  };

  const presetText =
    presetMap[payload.preset.toLowerCase()] ??
    (isTr ? "premium moda çekimi" : "premium fashion shoot");

  const itemList = analysis.items
    .map((item, i) => {
      const descriptor = [
        item.detectedColor,
        item.detectedMaterial,
        item.detectedType,
      ]
        .filter(Boolean)
        .join(" / ");

      return isTr
        ? `${i + 1}. ${item.labelTr}${descriptor ? ` (${descriptor})` : ""}: ${item.usageRuleTr}`
        : `${i + 1}. ${item.labelEn}${descriptor ? ` (${descriptor})` : ""}: ${item.usageRuleEn}`;
    })
    .join("\n");

  const lines: string[] = [];

  if (isTr) {
    lines.push(
      `Yüklenen tüm ürünleri birlikte kullanarak ${presetText} üret.`,
      "Yalnızca yüklenen ürünleri kullan.",
      "Yüklenmeyen yeni kıyafet, çanta, ayakkabı, takı veya aksesuar ekleme.",
      "Ürün sadakati çok yüksek olmalı.",
      "Her ürünün rengi, materyali, formu, dikişi ve silüeti korunmalı.",
      "Görsel gerçek moda fotoğrafı gibi görünmeli; yapay illüstrasyon hissi vermemeli.",
      "Tam boy moda fotoğrafı üret.",
      "Kafa tamamen kadraj içinde olsun.",
      "Ayaklar tamamen kadraj içinde olsun.",
      "Çanta, eller, takı ve ayakkabılar crop ile kesilmesin.",
      "Kamera biraz geri çekilmiş olsun ki tüm silüet rahat sığsın.",
      analysis.summaryTr,
      "Yüklenen ürün listesi:",
      itemList
    );

    if (payload.country) lines.push(`Ülke / hedef pazar: ${payload.country}.`);
    if (payload.city) lines.push(`Şehir / lokasyon hissi: ${payload.city}.`);
    if (payload.scene) lines.push(`Sahne / senaryo: ${payload.scene}.`);
    if (payload.background) lines.push(`Arka plan / atmosfer: ${payload.background}.`);
    if (payload.modelGender) lines.push(`Model cinsiyeti: ${payload.modelGender}.`);
    if (payload.modelAge) lines.push(`Model yaş hissi: ${payload.modelAge}.`);
    if (payload.modelLook) lines.push(`Model görünümü: ${payload.modelLook}.`);
    if (payload.pose) lines.push(`Poz: ${payload.pose}.`);
    if (payload.cameraAngle) lines.push(`Kamera açısı: ${payload.cameraAngle}.`);
    if (payload.styling) lines.push(`Styling yönü: ${payload.styling}.`);
    if (payload.lighting) lines.push(`Işık: ${payload.lighting}.`);
    if (payload.extraNotes) lines.push(`Ek notlar: ${payload.extraNotes}.`);

    lines.push(
      "No cropped head, no cropped feet, no missing bag, no missing jewelry, no wrong topwear, no wrong bottomwear, no wrong outerwear, no product mutation, no fake fabric, no plastic skin, no distorted anatomy."
    );

    if (payload.negativePrompt) {
      lines.push(`Yapılmaması gerekenler: ${payload.negativePrompt}.`);
    }
  } else {
    lines.push(
      `Create a ${presetText} using all uploaded items together.`,
      "Use only the uploaded products.",
      "Do not invent any new garment, bag, shoes, jewelry, or accessory.",
      "Preserve the exact colors, materials, silhouettes, seams, and overall visual identity.",
      "The image must feel like a real commercial fashion photo, not an AI illustration.",
      "Create a full-body fashion image.",
      "Keep the head fully inside frame.",
      "Keep the feet fully inside frame.",
      "Do not crop hands, bag, jewelry, or shoes.",
      "Use a slightly wider camera framing so the full silhouette fits comfortably.",
      analysis.summaryEn,
      "Uploaded item list:",
      itemList
    );

    if (payload.country) lines.push(`Country / market direction: ${payload.country}.`);
    if (payload.city) lines.push(`City / location vibe: ${payload.city}.`);
    if (payload.scene) lines.push(`Scene / scenario: ${payload.scene}.`);
    if (payload.background) lines.push(`Background / atmosphere: ${payload.background}.`);
    if (payload.modelGender) lines.push(`Model gender: ${payload.modelGender}.`);
    if (payload.modelAge) lines.push(`Model age direction: ${payload.modelAge}.`);
    if (payload.modelLook) lines.push(`Model look: ${payload.modelLook}.`);
    if (payload.pose) lines.push(`Pose: ${payload.pose}.`);
    if (payload.cameraAngle) lines.push(`Camera angle: ${payload.cameraAngle}.`);
    if (payload.styling) lines.push(`Styling direction: ${payload.styling}.`);
    if (payload.lighting) lines.push(`Lighting: ${payload.lighting}.`);
    if (payload.extraNotes) lines.push(`Extra notes: ${payload.extraNotes}.`);

    lines.push(
      "No cropped head, no cropped feet, no missing bag, no missing jewelry, no wrong topwear, no wrong bottomwear, no wrong outerwear, no product mutation, no fake fabric, no plastic skin, no distorted anatomy."
    );

    if (payload.negativePrompt) {
      lines.push(`Avoid: ${payload.negativePrompt}.`);
    }
  }

  return lines.join("\n");
}