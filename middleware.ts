import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/portal")) {
    const cookie = request.cookies.get("admin-auth");

    if (cookie?.value === process.env.ADMIN_PASSWORD) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};