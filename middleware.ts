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

/** Sends the browser to `path` and drops the session cookie on the way out. */
function clearSessionAndRedirect(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const [userId, role] = raw?.split("|") ?? [];

  // Resolve the cookie to a real account before anything routes on it. The
  // demo store is per-server-process, so a signup-created account vanishes on
  // redeploy, cold start, or a second instance — while the browser keeps
  // sending its cookie. Treating that stale cookie as a live session used to
  // let requests through to pages that then dereferenced a null user and
  // returned a 500; an unresolvable cookie is instead no session at all.
  const user = isRole(role) && userId ? findUserById(userId) : undefined;
  const stale = Boolean(raw) && !user;

  // Already signed in? Login, signup and root send you to your own home.
  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
    if (user) return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
    if (stale) return clearSessionAndRedirect(request, "/login");
    if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  const section = SECTIONS.find(
    (s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`)
  );
  if (!section) return NextResponse.next();

  // No session at all — sign in first. A stale cookie is dropped on the way
  // so the login page does not bounce straight back here.
  if (!user) return clearSessionAndRedirect(request, "/login");

  // Valid session in the wrong section — send them to their own home, not login.
  if (user.role !== section) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
  }

  // Faculty/HoD accounts must complete onboarding before using their real dashboard.
  if ((ONBOARDING_ROLES as readonly string[]).includes(user.role)) {
    const onboardingPath = `/${user.role}/onboarding`;
    if (user.status === "onboarding_incomplete" && pathname !== onboardingPath) {
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }
    if (user.status !== "onboarding_incomplete" && pathname === onboardingPath) {
      return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
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
