import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import {
  decrementCredit,
  findUserById,
  incrementGenerationCount,
} from "@/lib/fashion-store";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const uploadKeys = [
  "topwear",
  "bottomwear",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "jewelry",
] as const;

type UploadKey = (typeof uploadKeys)[number];

const uploadLabels: Record<UploadKey, string> = {
  topwear: "topwear / jacket / shirt",
  bottomwear: "bottomwear / pants / skirt",
  dress: "dress",
  outerwear: "outerwear / coat / jacket",
  shoes: "shoes",
  bag: "bag",
  jewelry: "jewelry / accessories",
};

function getCountryStyle(country: string) {
  const map: Record<string, string> = {
    Türkiye:
      "modern urban Istanbul street, soft daylight, refined city atmosphere",
    Fransa: "Paris street, elegant architecture, soft romantic daylight",
    İtalya: "historic Italian street, warm tones, cinematic sunlight",
    İngiltere: "London street, cloudy cinematic atmosphere, refined urban mood",
    Amerika: "modern New York style city street, dynamic urban energy",
    "Birleşik Arap Emirlikleri":
      "luxury Dubai cityscape, premium modern architecture, polished fashion setting",
    Mısır:
      "Egyptian desert atmosphere or pyramid-adjacent editorial setting, warm sand tones, cinematic sunlight",
    Almanya:
      "clean European street, modern minimal architecture, natural daylight",
    Norveç: "cold Nordic street, muted tones, soft cloudy light",
    İskandinav:
      "minimal Scandinavian city atmosphere, cool daylight, neutral palette, calm premium mood",
    Fas: "Moroccan riad or warm editorial street, earthy tones, textured elegant backdrop",
  };

  return map[country] || "generic premium modern city environment";
}

function normalizeActionPrompt(userPrompt: string) {
  const text = userPrompt.trim().toLowerCase();

  const actionMap: Record<string, string> = {
    yürürken: "walking naturally",
    koşarken: "running naturally",
    "yana bakarken": "looking to the side while posing naturally",
    bakarken: "looking to the side in a natural pose",
    dururken: "standing in a natural editorial pose",
    "karşıdan karşıya geçerken": "crossing the street naturally",
    "ışıklarda karşıya geçerken": "crossing the street at traffic lights",
    "telefonuna bakarken": "looking at her phone while walking naturally",
    "çölde yürürken": "walking naturally in a desert",
    "gün batımında ayakta dururken": "standing naturally at sunset",
    "rüzgarlı havada ayakta dururken":
      "standing naturally in windy weather with soft movement in clothes and hair",
  };

  return actionMap[text] || userPrompt.trim();
}

type UploadedItem = {
  key: UploadKey;
  label: string;
  buffer: Buffer;
};

async function createReferenceBoard(items: UploadedItem[]) {
  const boardWidth = 1600;
  const boardHeight = 1600;
  const gap = 24;
  const padding = 40;

  const columns = 2;
  const rows = Math.ceil(items.length / columns);

  const usableWidth = boardWidth - padding * 2 - gap * (columns - 1);
  const usableHeight = boardHeight - padding * 2 - gap * (rows - 1);

  const cellWidth = Math.floor(usableWidth / columns);
  const cellHeight = Math.floor(usableHeight / rows);

  const base = sharp({
    create: {
      width: boardWidth,
      height: boardHeight,
      channels: 3,
      background: { r: 244, g: 244, b: 242 },
    },
  });

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < items.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const left = padding + col * (cellWidth + gap);
    const top = padding + row * (cellHeight + gap);

    const cardBg = await sharp({
      create: {
        width: cellWidth,
        height: cellHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const innerPadding = 28;
    const fitWidth = cellWidth - innerPadding * 2;
    const fitHeight = cellHeight - innerPadding * 2;

    const fitted = await sharp(items[i].buffer)
      .resize({
        width: fitWidth,
        height: fitHeight,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    const fittedMeta = await sharp(fitted).metadata();
    const fittedWidth = fittedMeta.width || fitWidth;
    const fittedHeight = fittedMeta.height || fitHeight;

    const fittedLeft = left + Math.floor((cellWidth - fittedWidth) / 2);
    const fittedTop = top + Math.floor((cellHeight - fittedHeight) / 2);

    composites.push({
      input: cardBg,
      left,
      top,
    });

    composites.push({
      input: fitted,
      left: fittedLeft,
      top: fittedTop,
    });
  }

  return base.composite(composites).png().toBuffer();
}

function buildPrompt(
  country: string,
  userPrompt: string,
  uploadedParts: string[]
) {
  const uploadedText =
    uploadedParts.length > 0
      ? uploadedParts.map((part) => `- ${part}`).join("\n")
      : "- no uploaded parts";

  const countryStyle = getCountryStyle(country);
  const actionText = normalizeActionPrompt(userPrompt);

  return `
Create a hyper-realistic fashion photograph using the uploaded reference board.

STRICT PRODUCT LOCK RULES:
- The reference board contains EXACT products.
- These products must be used WITHOUT ANY CHANGE.
- DO NOT redesign, reinterpret, or approximate the items.
- DO NOT change shape, cut, proportions, or construction.
- DO NOT replace any item with a similar one.
- The goal is to reproduce the SAME products on a model.
- jewelry must be clearly visible and accurately reproduced
- small accessories must not be simplified
- do not stylize or improve clothing fit
- keep the original product shape exactly as in reference

VISUAL ACCURACY:
- match colors exactly
- match proportions exactly
- match silhouette exactly
- match structure and details exactly

OUTFIT RULES:
- use all uploaded items together
- do not invent alternative clothing
- missing parts can be minimal and neutral only

REFERENCE BOARD ITEMS:
${uploadedText}

FRAMING:
- full body visible
- head fully visible
- legs fully visible
- no crop
- model centered
- fashion editorial framing

VISIBILITY:
- all products clearly visible
- bag must be fully visible
- clothing must not be hidden
- no hand or pose blocking the products

SCENE:
- keep background supportive, not dominant
- ${countryStyle}
- action: ${actionText}

MODEL:
- realistic fashion model
- natural proportions
- premium editorial pose

LIGHT:
- soft cinematic lighting
- realistic shadows
- clean material response

GOAL:
- exact product reproduction on a real model
- highly realistic
- commercially usable
`;
}

function isValidImageFile(file: File) {
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp"
  );
}

export async function POST(req: Request) {
  try {
    const userId = await getFashionSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const user = findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const country = String(formData.get("country") || "").trim();
    const prompt = String(formData.get("prompt") || "").trim();

    if (!country || !prompt) {
      return NextResponse.json(
        { error: "Ülke ve prompt zorunludur." },
        { status: 400 }
      );
    }

    const uploadedParts: string[] = [];
    const uploadedItems: UploadedItem[] = [];

    for (const key of uploadKeys) {
      const file = formData.get(key);

      if (file && file instanceof File) {
        if (!isValidImageFile(file)) {
          return NextResponse.json(
            { error: "Sadece PNG, JPG veya WEBP yükleyebilirsiniz." },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        uploadedItems.push({
          key,
          label: uploadLabels[key],
          buffer,
        });

        uploadedParts.push(uploadLabels[key]);
      }
    }

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        { error: "En az 1 ürün yüklemelisiniz." },
        { status: 400 }
      );
    }

    const creditResult = decrementCredit(userId, 1);

    if (!creditResult.ok) {
      return NextResponse.json(
        { error: "Krediniz yetersiz." },
        { status: 402 }
      );
    }

    const referenceBoard = await createReferenceBoard(uploadedItems);
    const finalPrompt = buildPrompt(country, prompt, uploadedParts);

    const boardAsFile = new File(
      [new Uint8Array(referenceBoard)],
      "reference-board.png",
      {
        type: "image/png",
      }
    );

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: boardAsFile,
      prompt: finalPrompt,
      n: 2,
      size: "1024x1536",
    });

    const images =
      result.data?.flatMap((item) =>
        item.b64_json ? [`data:image/png;base64,${item.b64_json}`] : []
      ) || [];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "AI görsel üretti ama çıktı alınamadı." },
        { status: 500 }
      );
    }

    incrementGenerationCount(userId, 1);

    const referenceBoardBase64 = `data:image/png;base64,${referenceBoard.toString(
      "base64"
    )}`;

    return NextResponse.json({
      success: true,
      remainingCredits: creditResult.credits,
      uploadedParts,
      usedPrompt: finalPrompt,
      referenceBoard: referenceBoardBase64,
      images,
    });
  } catch (error: any) {
    console.error("Fashion generate error full:", error);
    console.error("Fashion generate error message:", error?.message);
    console.error("Fashion generate error response:", error?.response?.data);

    return NextResponse.json(
      {
        error: error?.message || "AI üretim sırasında hata oluştu.",
      },
      { status: 500 }
    );
  }
}