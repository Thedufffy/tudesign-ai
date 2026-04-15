import { NextResponse } from "next/server";
import { findUserByCredentials, getPublicUser } from "@/lib/fashion-store";
import {
  clearFashionSession,
  setFashionSession,
} from "@/lib/fashion-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!email) {
      await clearFashionSession();
      return NextResponse.json(
        { error: "E-posta gerekli." },
        { status: 400 }
      );
    }

    const user = await findUserByCredentials(email, password);

    if (!user) {
      await clearFashionSession();
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    await setFashionSession({
      email: user.email,
      role: user.role,
      modules: user.modules,
    });

    return NextResponse.json({
      success: true,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("fashion me error:", error);
    await clearFashionSession();

    return NextResponse.json(
      { error: "Kullanıcı bilgisi alınamadı." },
      { status: 500 }
    );
  }
}