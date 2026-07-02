import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight no-auth gate: anyone with the shared passcode can enter /admin.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect every /admin route EXCEPT the login page itself.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const unlocked = request.cookies.get("admin_unlocked");
    if (!unlocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
