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
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const currentUser = await findUserByIdIncludingInactive(sessionUserId);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Yetkisiz işlem." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!id && !email) {
      return NextResponse.json(
        { error: "Kullanıcı güncellemek için id veya email gerekli." },
        { status: 400 }
      );
    }

    const targetUser = id
      ? await findUserByIdIncludingInactive(id)
      : await findUserByIdIncludingInactive(email);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const credits =
      typeof body?.credits === "number"
        ? body.credits
        : typeof body?.credits === "string" && body.credits.trim() !== ""
        ? Number(body.credits)
        : undefined;

    const updated = await updateFashionUser({
      email: targetUser.email,
      name:
        typeof body?.username === "string"
          ? body.username.trim()
          : typeof body?.name === "string"
          ? body.name.trim()
          : undefined,
      company:
        typeof body?.companyName === "string"
          ? body.companyName.trim()
          : typeof body?.company === "string"
          ? body.company.trim()
          : undefined,
      credits:
        typeof credits === "number" && Number.isFinite(credits)
          ? Math.max(0, Math.floor(credits))
          : undefined,
      isActive:
        typeof body?.isActive === "boolean" ? body.isActive : undefined,
      role:
        body?.role === "admin" || body?.role === "client"
          ? body.role
          : undefined,
      modules: Array.isArray(body?.modules) ? body.modules : undefined,
    });

    const users = await getAllPublicUsers();

    return NextResponse.json({
      ok: true,
      user: updated,
      users,
    });
  } catch (error) {
    console.error("fashion admin update-user error:", error);

    return NextResponse.json(
      { error: "Kullanıcı güncellenemedi." },
      { status: 500 }
    );
  }
}