import { NextResponse } from "next/server";
import { portalUsers } from "@/lib/portal-users";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı ve şifre gerekli." },
        { status: 400 }
      );
    }

    // 1) Önce env tabanlı ana admin kontrolü
    if (username === ADMIN_USERNAME) {
      if (!ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "ADMIN_PASSWORD tanımlı değil." },
          { status: 500 }
        );
      }

      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "Kullanıcı adı veya şifre hatalı." },
          { status: 401 }
        );
      }

      const adminUser = {
        username: "admin",
        email: "admin@tudesign.local",
        role: "admin" as const,
        modules: [
          "admin",
          "render-lab",
          "fashion",
          "references",
          "uploads",
          "works",
        ],
      };

      const response = NextResponse.json({
        success: true,
        message: "Giriş başarılı",
        user: adminUser,
      });

      response.cookies.set("tudesign_admin", JSON.stringify(adminUser), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2) Sonra portal-users.ts içindeki normal kullanıcılar
    const matchedUser = portalUsers.find(
      (user) => user.username === username && user.password === password
    );

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    const sessionUser = {
      username: matchedUser.username,
      role: matchedUser.role,
      modules: matchedUser.modules,
    };

    const response = NextResponse.json({
      success: true,
      message: "Giriş başarılı",
      user: sessionUser,
    });

    response.cookies.set("tudesign_admin", JSON.stringify(sessionUser), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Login hatası oluştu." },
      { status: 500 }
    );
  }
}