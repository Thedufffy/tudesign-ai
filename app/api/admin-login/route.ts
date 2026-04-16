import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "ADMIN_PASSWORD tanımlı değil." },
        { status: 500 }
      );
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    // cookie set (senin sistemde varsa aynısını koru)
    return NextResponse.json({
      success: true,
      message: "Giriş başarılı",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Login hatası oluştu." },
      { status: 500 }
    );
  }
}