import { NextResponse } from "next/server";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import {
  findUserByIdIncludingInactive,
  getAllPublicUsers,
  updateFashionUser,
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

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Kullanıcı id zorunludur." },
        { status: 400 }
      );
    }

    const updated = updateFashionUser({
      id,
      companyName:
        typeof body.companyName === "string" ? body.companyName.trim() : undefined,
      username:
        typeof body.username === "string" ? body.username.trim() : undefined,
      password:
        typeof body.password === "string" ? body.password.trim() : undefined,
      credits:
        typeof body.credits === "number" ? body.credits : undefined,
      isActive:
        typeof body.isActive === "boolean" ? body.isActive : undefined,
      role: body.role === "admin" || body.role === "client" ? body.role : undefined,
    });

    if (!updated.ok) {
      return NextResponse.json({ error: updated.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: updated.user,
      users: getAllPublicUsers(),
    });
  } catch {
    return NextResponse.json(
      { error: "Kullanıcı güncellenemedi." },
      { status: 500 }
    );
  }
}