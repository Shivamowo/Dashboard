import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/demo-accounts";
import { findUserByCredentials, type Role } from "@/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Signs in against Supabase Auth (email + password) when configured. Without
 * a Supabase project set up (no NEXT_PUBLIC_SUPABASE_URL/ANON_KEY), falls
 * back to the unsigned demo cookie — see lib/demo-accounts.ts. Username is
 * the account's email in the Supabase path (see scripts/create-logins.ts).
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error || !data.user) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = (profile?.role as Role | undefined) ?? "faculty";
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url), { status: 303 });
  }

  const user = findUserByCredentials(username, password);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
  }
  const response = NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, `${user.id}|${user.role}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
