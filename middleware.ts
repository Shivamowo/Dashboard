import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ROLE_HOME, SESSION_COOKIE, isRole } from "@/lib/demo-accounts";
import { findUserById } from "@/data";
import { FACULTY_LOGINS_ENABLED } from "@/lib/feature-flags";
import { SESSION_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Route protection. When Supabase is configured this refreshes the real auth
 * session (via @supabase/ssr) and reads the caller's profile (role/dept/
 * faculty/status) to enforce the same per-role path guards the demo cookie
 * system used. Without Supabase configured it falls back to the unsigned demo
 * cookie — see lib/demo-accounts.ts.
 *
 * Runs on the Node.js runtime (not edge) so the demo fallback can read the
 * same in-memory store (data/store.ts, anchored on globalThis) as the rest of
 * the app.
 */
export const runtime = "nodejs";

const SECTIONS = ["vc", "registrar", "hod", "faculty", "et", "admin"] as const;
const ONBOARDING_ROLES = ["faculty", "hod"] as const;

const ACCOUNT_PASSWORD_PATH = "/account/password";

type SessionUser = {
  role: (typeof SECTIONS)[number];
  status: "onboarding_incomplete" | "pending_approval" | "active";
  mustChangePassword: boolean;
};

function clearSessionAndRedirect(request: NextRequest, path: string, response?: NextResponse) {
  const res = response ?? NextResponse.next();
  const redirectRes = NextResponse.redirect(new URL(path, request.url));
  res.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
  redirectRes.cookies.delete(SESSION_COOKIE);
  return redirectRes;
}

async function resolveSupabaseUser(
  request: NextRequest,
  response: NextResponse
): Promise<SessionUser | undefined> {
  const supabase = createServerClient<any>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status,must_change_password")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !isRole(profile.role)) return undefined;
  // Faculty logins are locked for now — see lib/feature-flags.ts.
  if (profile.role === "faculty" && !FACULTY_LOGINS_ENABLED) return undefined;
  return {
    role: profile.role as SessionUser["role"],
    status: profile.status,
    mustChangePassword: profile.must_change_password,
  };
}

/** Forced password change only applies under real Supabase auth — see app/account/password. */
function resolveDemoUser(request: NextRequest): SessionUser | undefined {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const [userId, role] = raw?.split("|") ?? [];
  const user = isRole(role) && userId ? findUserById(userId) : undefined;
  if (user?.role === "faculty" && !FACULTY_LOGINS_ENABLED) return undefined;
  return user ? { role: user.role, status: user.status, mustChangePassword: false } : undefined;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  const user = isSupabaseConfigured
    ? await resolveSupabaseUser(request, response)
    : resolveDemoUser(request);
  const stale = !isSupabaseConfigured && Boolean(request.cookies.get(SESSION_COOKIE)?.value) && !user;

  // Already signed in? Login, signup and root send you to your own home (or
  // to the forced password change, if that's still outstanding).
  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
    if (user) {
      const dest = user.mustChangePassword ? ACCOUNT_PASSWORD_PATH : ROLE_HOME[user.role];
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (stale) return clearSessionAndRedirect(request, "/login", response);
    if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }

  // Account settings (password change) is reachable by any authenticated
  // role — not gated by section/onboarding, since it must stay reachable
  // even mid-onboarding or mid-forced-change.
  if (pathname.startsWith("/account")) {
    if (!user) return clearSessionAndRedirect(request, "/login", response);
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  const section = SECTIONS.find((s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`));
  if (!section) return response;

  // No session at all — sign in first.
  if (!user) return clearSessionAndRedirect(request, "/login", response);

  // Valid session in the wrong section — send them to their own home, not login.
  if (user.role !== section) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
  }

  // Still on a temp password (real Supabase accounts only) — unskippable
  // until they set their own. See app/account/password.
  if (user.mustChangePassword) {
    return NextResponse.redirect(new URL(ACCOUNT_PASSWORD_PATH, request.url));
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

  // Protected pages must not be served from the back/forward cache after logout.
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/account/:path*",
    "/vc/:path*",
    "/registrar/:path*",
    "/hod/:path*",
    "/faculty/:path*",
    "/et/:path*",
    "/admin/:path*",
  ],
};
