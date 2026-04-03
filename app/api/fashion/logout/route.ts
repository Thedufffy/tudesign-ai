import { NextResponse } from "next/server";
import { clearFashionSession } from "@/lib/fashion-auth";

export async function POST() {
  try {
    await clearFashionSession();

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Çıkış yapılırken hata oluştu." },
      { status: 500 }
    );
  }
}