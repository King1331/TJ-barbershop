import { NextResponse } from "next/server";

export function middleware(request) {
  const isAdmin = request.cookies.get("isAdmin");

  if (!isAdmin && request.nextUrl.pathname.startsWith("/admin_tab")) {
    return NextResponse.redirect(
      new URL("/admin_login/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin_tab/:path*"],
};
