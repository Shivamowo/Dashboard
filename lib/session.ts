import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserById, type Role, type UserAccount } from "@/data";
import { SESSION_COOKIE, isRole } from "./demo-accounts";
import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

/** Demo cookie value is "<userId>|<role>" — only used when Supabase is not configured. */
async function parseDemoSessionCookie(): Promise<{ userId: string; role: Role } | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [userId, role] = value.split("|");
  if (!userId || !isRole(role)) return null;
  return { userId, role };
}

interface ProfileRow {
  id: string;
  role: Role;
  dept_id: string | null;
  faculty_id: string | null;
  display_name: string;
  status: UserAccount["status"];
  rejection_reason: string | null;
  created_at: string;
  must_change_password: boolean;
}

/** Maps a Supabase auth user + profile row onto the same shape the rest of
 * the app already reads (data/types.ts#UserAccount), so no other file needs
 * to know whether auth is backed by Supabase or the demo cookie. */
function toUserAccount(email: string, profile: ProfileRow): UserAccount {
  return {
    id: profile.id,
    username: email,
    password: "",
    role: profile.role,
    displayName: profile.display_name,
    deptId: profile.dept_id ?? undefined,
    facultyId: profile.faculty_id ?? undefined,
    status: profile.status,
    rejectionReason: profile.rejection_reason ?? undefined,
    createdAt: profile.created_at,
    mustChangePassword: profile.must_change_password,
  };
}

async function getSupabaseSessionUser(): Promise<UserAccount | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;

  return toUserAccount(user.email ?? "", profile as ProfileRow);
}

/** Reads the signed-in user's role — Supabase session when configured, else the demo cookie. */
export async function getSessionRole(): Promise<Role | null> {
  if (isSupabaseConfigured) return (await getSupabaseSessionUser())?.role ?? null;
  return (await parseDemoSessionCookie())?.role ?? null;
}

/** Full signed-in user record — role, scope (deptId/facultyId) and onboarding status. */
export async function getSessionUser(): Promise<UserAccount | null> {
  if (isSupabaseConfigured) return getSupabaseSessionUser();
  const parsed = await parseDemoSessionCookie();
  if (!parsed) return null;
  return findUserById(parsed.userId) ?? null;
}

/**
 * Session user for pages that cannot render without one, redirecting to
 * /login instead of throwing when the session is missing or stale.
 */
export async function requireSessionUser(): Promise<UserAccount> {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=expired");
  return user;
}
