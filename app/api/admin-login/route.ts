import { NextResponse } from "next/server";
import { portalUsers } from "@/lib/portal-users";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = portalUsers.find(
      (item) => item.username === username && item.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Hatalı kullanıcı adı veya şifre." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        isAdmin: !!user.isAdmin,
        canAccessRenderLab: !!user.canAccessRenderLab,
        canAccessFashion: !!user.canAccessFashion,
        canAccessReferences: !!user.canAccessReferences,
        canAccessUploads: !!user.canAccessUploads,
        canAccessWorks: !!user.canAccessWorks,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Login hatası." },
      { status: 500 }
    );
  }
}