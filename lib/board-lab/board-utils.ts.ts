// lib/board-lab/board-utils.ts

export function safeProjectTitle(value: string) {
  const trimmed = value.trim();
  if (trimmed.length >= 3) return trimmed;
  return "Proje";
}

export async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${file.type || "image/jpeg"};base64,${base64}`;
}

export function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  const arr = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return arr.length ? arr : fallback;
}

export function normalizeColorPalette(value: unknown) {
  const fallback = ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"];

  if (!Array.isArray(value)) return fallback;

  const colors = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) =>
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(item)
    );

  return colors.length ? colors.slice(0, 5) : fallback;
}

export function fallbackAnalysis(projectTitle: string) {
  return {
    projectTitle,
    spaceType: "interior",
    conceptText:
      "Bu pafta, yüklenen mahal görselinin mevcut kompozisyonu korunarak detay odaklı bir sunum diline aktarılmış halidir.",
    functionText: [
      "Ana mahal görseli korunmuştur",
      "Sunum paftasına dönüştürülmüştür",
      "Malzeme ve renk dili analiz edilmiştir",
    ],
    materialPalette: ["Mermer", "Ahşap", "Duvar", "Zemin"],
    colorPalette: ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"],
    detailNotes: [
      "Ana görsel korunmuştur",
      "Detay alanları oluşturulmuştur",
      "Sunum dili optimize edilmiştir",
    ],
  };
}