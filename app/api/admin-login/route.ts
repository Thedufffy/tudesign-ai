import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true });

    res.cookies.set("admin-auth", password, {
      httpOnly: true,
      path: "/",
    });

    return res;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}