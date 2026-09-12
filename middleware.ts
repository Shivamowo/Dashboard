import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, isRole } from "@/lib/demo-accounts";

/**
 * DEMO-ONLY route protection. The session cookie is unsigned, so this enforces
 * navigation scoping for the demo — it is not a security boundary.
 */
const SECTIONS = ["vc", "registrar", "hod", "faculty", "et"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = isRole(role) ? role : null;

  // Already signed in? The login page and root send you to your own home.
  if (pathname === "/login" || pathname === "/") {
    if (valid) return NextResponse.redirect(new URL(ROLE_HOME[valid], request.url));
    if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  const section = SECTIONS.find(
    (s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`)
  );
  if (!section) return NextResponse.next();

  // No session at all — sign in first.
  if (!valid) return NextResponse.redirect(new URL("/login", request.url));

  // Valid session in the wrong section — send them to their own home, not login.
  if (valid !== section) {
    return NextResponse.redirect(new URL(ROLE_HOME[valid], request.url));
  }

  const response = NextResponse.next();
  // Protected pages must not be served from the back/forward cache after logout.
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/", "/login", "/vc/:path*", "/registrar/:path*", "/hod/:path*", "/faculty/:path*", "/et/:path*"],
};
