import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getPortalUser } from "@/lib/fashion-auth";
import {
  addFashionGenerationLog,
  consumeFashionCredits,
  getFashionUserByEmail,
} from "@/lib/fashion-store";
import {
  analyzeUploadedItems,
  collectUploadedItems,
  type UploadedItem,
} from "@/lib/fashion-analyzer";
import {
  buildFashionPrompt,
  getGeneratePayload,
} from "@/lib/fashion-prompt-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_MODULES = new Set(["fashion", "fashion-studio"]);
const DEFAULT_RESULT_COUNT = 2;
const MAX_RESULT_COUNT = 4;

function hasFashionModule(user: {
  role: "admin" | "client";
  modules: string[];
}) {
  if (user.role === "admin") return true;

  return user.modules.some((moduleName) =>
    ALLOWED_MODULES.has(moduleName.toLowerCase())
  );
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function buildReferenceBoard(items: UploadedItem[]) {
  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      dataUrl: await fileToDataUrl(item.file),
    }))
  );

  const cols = resolved.length <= 2 ? resolved.length : 2;
  const rows = Math.ceil(resolved.length / 2);

  const cellWidth = 320;
  const cellHeight = 320;
  const gap = 18;
  const padding = 24;
  const headerHeight = 44;

  const width = padding * 2 + cols * cellWidth + Math.max(0, cols - 1) * gap;
  const height =
    padding * 2 +
    headerHeight +
    rows * cellHeight +
    Math.max(0, rows - 1) * gap;

  const cells = resolved
    .map((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = padding + col * (cellWidth + gap);
      const y = padding + headerHeight + row * (cellHeight + gap);

      return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="${cellWidth}" height="${cellHeight}" fill="#ffffff" stroke="#d8d8d8"/>
          <image href="${item.dataUrl}" x="14" y="14" width="${cellWidth - 28}" height="${
        cellHeight - 64
      }" preserveAspectRatio="xMidYMid meet" />
          <rect x="0" y="${cellHeight - 42}" width="${cellWidth}" height="42" fill="#ffffff"/>
          <text x="16" y="${cellHeight - 16}" font-family="Arial, sans-serif" font-size="15" fill="#111111">
            ${item.labelTr}
          </text>
        </g>
      `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f3f3f1"/>
      <text x="${padding}" y="20" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" fill="#555555">
        AI REFERENCE BOARD
      </text>
      ${cells}
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY tanımlı değil." },
        { status: 500 }
      );
    }

    const portalUser = await getPortalUser();

    if (!portalUser) {
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    if (!hasFashionModule(portalUser)) {
      return NextResponse.json(
        { error: "Fashion Studio erişim yetkiniz yok." },
        { status: 403 }
      );
    }

    const email = portalUser.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Kullanıcı e-postası bulunamadı." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const uploadedItems = collectUploadedItems(formData);

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        { error: "En az 1 ürün görseli yüklemelisiniz." },
        { status: 400 }
      );
    }

    const payload = getGeneratePayload(
      formData,
      DEFAULT_RESULT_COUNT,
      MAX_RESULT_COUNT
    );

    const analysis = await analyzeUploadedItems(uploadedItems);
    const prompt = buildFashionPrompt(payload, analysis, uploadedItems);

    const isAdmin = portalUser.role === "admin";
    const fashionUser = await getFashionUserByEmail(email);

    if (!isAdmin && !fashionUser) {
      return NextResponse.json(
        { error: "Fashion Studio kullanıcı kaydı bulunamadı." },
        { status: 403 }
      );
    }

    if (!isAdmin && fashionUser && !fashionUser.isActive) {
      return NextResponse.json(
        { error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    if (!isAdmin && fashionUser && fashionUser.credits < 1) {
      return NextResponse.json(
        { error: "Yetersiz kredi." },
        { status: 402 }
      );
    }

    const imageResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: uploadedItems.map((item) => item.file),
      prompt,
      size: "1024x1536",
      n: payload.resultCount,
    });

    const results =
      imageResponse.data
        ?.map((item) => item.b64_json)
        .filter((value): value is string => Boolean(value))
        .map((base64) => `data:image/png;base64,${base64}`) ?? [];

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Görsel üretilemedi." },
        { status: 500 }
      );
    }

    let remainingCredits: number | null = null;
    let creditsUsed = 0;

    if (!isAdmin) {
      const consumeResult = await consumeFashionCredits(email, 1);

      if (!consumeResult.ok) {
        if (consumeResult.reason === "INSUFFICIENT_CREDITS") {
          return NextResponse.json(
            { error: "Yetersiz kredi." },
            { status: 402 }
          );
        }

        if (consumeResult.reason === "USER_INACTIVE") {
          return NextResponse.json(
            { error: "Kullanıcı pasif durumda." },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: "Kredi düşümü yapılamadı." },
          { status: 500 }
        );
      }

      remainingCredits = consumeResult.user.credits;
      creditsUsed = 1;
    }

    const referenceBoard = await buildReferenceBoard(uploadedItems);

    await addFashionGenerationLog({
      userEmail: email,
      creditsUsed,
      resultCount: results.length,
      preset: payload.preset,
      locale: payload.locale,
      country: payload.country,
      prompt,
    });

    return NextResponse.json({
      ok: true,
      results,
      referenceBoard,
      remainingCredits,
      creditsUsed,
      analysis,
      user: {
        email,
        role: portalUser.role,
      },
      meta: {
        preset: payload.preset,
        locale: payload.locale,
        resultCount: results.length,
        uploadedKeys: uploadedItems.map((item) => item.key),
      },
    });
  } catch (error) {
    console.error("fashion generate error:", error);

    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";

    return NextResponse.json(
      { error: message || "Üretim sırasında hata oluştu." },
      { status: 500 }
    );
  }
}