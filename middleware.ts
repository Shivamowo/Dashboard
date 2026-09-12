import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, isRole } from "@/lib/demo-accounts";
import { findUserById } from "@/data";

/**
 * DEMO-ONLY route protection. The session cookie is unsigned, so this enforces
 * navigation scoping for the demo — it is not a security boundary.
 *
 * Runs on the Node.js runtime (not edge) so it can read the same in-memory
 * store (data/store.ts, anchored on globalThis) as the rest of the app —
 * needed for the onboarding-status redirect below.
 */
export const runtime = "nodejs";

const SECTIONS = ["vc", "registrar", "hod", "faculty", "et", "admin"] as const;
/** Roles that go through a post-signup onboarding step before their dashboard is usable. */
const ONBOARDING_ROLES = ["faculty", "hod"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const [userId, role] = raw?.split("|") ?? [];
  const valid = isRole(role) ? role : null;

  // Already signed in? Login, signup and root send you to your own home.
  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
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

  // Faculty/HoD accounts must complete onboarding before using their real dashboard.
  if ((ONBOARDING_ROLES as readonly string[]).includes(valid) && userId) {
    const user = findUserById(userId);
    const onboardingPath = `/${valid}/onboarding`;
    if (user?.status === "onboarding_incomplete" && pathname !== onboardingPath) {
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }
    if (user && user.status !== "onboarding_incomplete" && pathname === onboardingPath) {
      return NextResponse.redirect(new URL(ROLE_HOME[valid], request.url));
    }
  }

  const response = NextResponse.next();
  // Protected pages must not be served from the back/forward cache after logout.
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/vc/:path*",
    "/registrar/:path*",
    "/hod/:path*",
    "/faculty/:path*",
    "/et/:path*",
    "/admin/:path*",
  ],
};
