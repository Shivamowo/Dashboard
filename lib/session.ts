import { cookies } from "next/headers";
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
