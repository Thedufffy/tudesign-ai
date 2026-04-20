// lib/board-lab/image-analysis.ts

type CropBox = {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
};

export type GeneratedDetailImage = {
  src: string;
  label: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeMimeType(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || "image/jpeg";
}

function stripDataUrlPrefix(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return dataUrl;
  return dataUrl.slice(commaIndex + 1);
}

function buildDataUrl(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`;
}

function getDefaultCropBoxes(): CropBox[] {
  return [
    { x: 0.06, y: 0.08, width: 0.34, height: 0.28 },
    { x: 0.58, y: 0.16, width: 0.30, height: 0.34 },
    { x: 0.20, y: 0.58, width: 0.46, height: 0.26 },
  ];
}

function normalizeCropBox(box: CropBox): CropBox {
  const width = clamp(box.width, 0.12, 1);
  const height = clamp(box.height, 0.12, 1);
  const x = clamp(box.x, 0, 1 - width);
  const y = clamp(box.y, 0, 1 - height);

  return { x, y, width, height };
}

export async function createDetailCropsFromDataUrl(params: {
  imageDataUrl: string;
  cropBoxes?: CropBox[];
  quality?: number;
}): Promise<GeneratedDetailImage[]> {
  const { imageDataUrl, cropBoxes, quality = 0.92 } = params;

  const imageBuffer = Buffer.from(stripDataUrlPrefix(imageDataUrl), "base64");
  const cropList = (cropBoxes?.length ? cropBoxes : getDefaultCropBoxes()).map(
    normalizeCropBox
  );

  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
      return [
        { src: imageDataUrl, label: "Detay 01" },
        { src: imageDataUrl, label: "Detay 02" },
        { src: imageDataUrl, label: "Detay 03" },
      ];
    }

    const results: GeneratedDetailImage[] = [];

    for (let i = 0; i < cropList.length; i++) {
      const box = cropList[i];

      const left = Math.round(box.x * width);
      const top = Math.round(box.y * height);
      const cropWidth = Math.max(120, Math.round(box.width * width));
      const cropHeight = Math.max(120, Math.round(box.height * height));

      const safeLeft = clamp(left, 0, Math.max(0, width - cropWidth));
      const safeTop = clamp(top, 0, Math.max(0, height - cropHeight));

      const cropped = await sharp(imageBuffer)
        .extract({
          left: safeLeft,
          top: safeTop,
          width: Math.min(cropWidth, width - safeLeft),
          height: Math.min(cropHeight, height - safeTop),
        })
        .jpeg({ quality: Math.round(quality * 100) })
        .toBuffer();

      results.push({
        src: buildDataUrl(cropped.toString("base64"), "image/jpeg"),
        label: `Detay 0${i + 1}`,
      });
    }

    return results;
  } catch {
    return [
      { src: imageDataUrl, label: "Detay 01" },
      { src: imageDataUrl, label: "Detay 02" },
      { src: imageDataUrl, label: "Detay 03" },
    ];
  }
}