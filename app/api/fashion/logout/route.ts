import { NextResponse } from "next/server";
import { clearFashionSession } from "@/lib/fashion-auth";

export async function POST() {
  try {
    await clearFashionSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("fashion logout error:", error);

    return NextResponse.json(
      { error: "Çıkış işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}