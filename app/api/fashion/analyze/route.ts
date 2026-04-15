import { NextResponse } from "next/server";
import {
  analyzeUploadedItems,
  collectUploadedItems,
} from "@/lib/fashion-analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedItems = collectUploadedItems(formData);

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "En az 1 ürün görseli yüklemelisiniz." },
        { status: 400 }
      );
    }

    const analysis = await analyzeUploadedItems(uploadedItems);

    return NextResponse.json({
      ok: true,
      analysis,
      meta: {
        uploadedKeys: uploadedItems.map((item) => item.key),
        uploadedCount: uploadedItems.length,
      },
    });
  } catch (error) {
    console.error("fashion analyze error:", error);

    const message =
      error instanceof Error ? error.message : "Analyze sırasında hata oluştu.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}