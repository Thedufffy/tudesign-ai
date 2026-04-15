import { NextResponse } from "next/server";
import { getFashionSessionUserId } from "@/lib/fashion-auth";
import {
  findUserByIdIncludingInactive,
  getAllPublicUsers,
} from "@/lib/fashion-store";

export async function GET() {
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

    const users = await getAllPublicUsers();

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error) {
    console.error("fashion admin list-users error:", error);

    return NextResponse.json(
      { error: "Kullanıcılar alınamadı." },
      { status: 500 }
    );
  }
}