import { NextResponse } from "next/server";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import {
  createFashionUser,
  findUserByIdIncludingInactive,
  getAllPublicUsers,
} from "@/lib/fashion-store";

export async function POST(req: Request) {
  try {
    const sessionUserId = await getFashionSessionUserId();

    if (!sessionUserId) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const currentUser = findUserByIdIncludingInactive(sessionUserId);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const body = await req.json();

    const companyName = String(body.companyName || "").trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();
    const credits = Number(body.credits || 0);

    if (!companyName || !username || !password) {
      return NextResponse.json(
        { error: "Firma adı, kullanıcı adı ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (Number.isNaN(credits) || credits < 0) {
      return NextResponse.json(
        { error: "Kredi değeri geçersiz." },
        { status: 400 }
      );
    }

    const created = createFashionUser({
      companyName,
      username,
      password,
      credits,
      role: "client",
    });

    if (!created.ok) {
      return NextResponse.json({ error: created.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: created.user,
      users: getAllPublicUsers(),
    });
  } catch {
    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı." },
      { status: 500 }
    );
  }
}