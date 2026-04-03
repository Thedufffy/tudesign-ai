import { NextResponse } from "next/server";
import { findUserByCredentials, getPublicUser } from "@/lib/fashion-store";
import { clearFashionSession, setFashionSession } from "@/lib/fashion-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const user = findUserByCredentials(username, password);

    if (!user) {
      await clearFashionSession();

      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    await setFashionSession(user.id);

    return NextResponse.json({
      success: true,
      user: getPublicUser(user),
    });
  } catch {
    return NextResponse.json(
      { error: "Giriş yapılırken hata oluştu." },
      { status: 500 }
    );
  }
}