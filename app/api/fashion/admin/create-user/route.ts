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

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const company =
      typeof body?.company === "string" ? body.company.trim() : "";
    const credits =
      typeof body?.credits === "number"
        ? body.credits
        : typeof body?.credits === "string" && body.credits.trim() !== ""
        ? Number(body.credits)
        : 0;
    const isActive =
      typeof body?.isActive === "boolean" ? body.isActive : true;

    if (!email) {
      return NextResponse.json(
        { error: "E-posta zorunlu." },
        { status: 400 }
      );
    }

    const created = await createFashionUser({
      email,
      name: name || email.split("@")[0],
      company,
      credits: Number.isFinite(credits) ? Math.max(0, Math.floor(credits)) : 0,
      isActive,
      role: "client",
      modules: ["fashion"],
    });

    if (!created) {
      return NextResponse.json(
        { error: "Bu e-posta ile kayıtlı kullanıcı zaten var." },
        { status: 409 }
      );
    }

    const users = await getAllPublicUsers();

    return NextResponse.json({
      ok: true,
      user: created,
      users,
    });
  } catch (error) {
    console.error("fashion admin create-user error:", error);

    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı." },
      { status: 500 }
    );
  }
}