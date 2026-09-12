import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserById, type Role, type UserAccount } from "@/data";
import { SESSION_COOKIE, isRole } from "./demo-accounts";

/** Session cookie value is "<userId>|<role>" — see app/api/login/route.ts. */
async function parseSessionCookie(): Promise<{ userId: string; role: Role } | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [userId, role] = value.split("|");
  if (!userId || !isRole(role)) return null;
  return { userId, role };
}

/** Reads the demo session cookie. Mock auth — see lib/demo-accounts.ts. */
export async function getSessionRole(): Promise<Role | null> {
  return (await parseSessionCookie())?.role ?? null;
}

/** Full signed-in user record — role, scope (deptId/facultyId) and onboarding status. */
export async function getSessionUser(): Promise<UserAccount | null> {
  const parsed = await parseSessionCookie();
  if (!parsed) return null;
  return findUserById(parsed.userId) ?? null;
}

/**
 * Session user for pages that cannot render without one, redirecting to
 * /login instead of throwing when the session is missing or stale.
 *
 * A cookie can outlive the account it names: the demo store (data/store.ts)
 * is per-server-process, so a signup-created user disappears whenever the
 * process restarts — a redeploy, a cold start, or a second instance on
 * Vercel. The browser still sends the old cookie, findUserById returns
 * undefined, and the page would dereference null and 500. Middleware clears
 * such cookies, but Server Components must not depend on that: middleware
 * and the render can run in separate instances with separate stores.
 */
export async function requireSessionUser(): Promise<UserAccount> {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=expired");
  return user;
}
