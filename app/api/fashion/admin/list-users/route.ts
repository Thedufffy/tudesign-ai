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
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const currentUser = findUserByIdIncludingInactive(sessionUserId);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    return NextResponse.json({
      users: getAllPublicUsers(),
    });
  } catch {
    return NextResponse.json(
      { error: "Kullanıcı listesi alınamadı." },
      { status: 500 }
    );
  }
}