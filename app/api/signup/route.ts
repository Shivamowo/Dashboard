import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/demo-accounts";
import { createUserAccount, departmentById, upsertLocalUser } from "@/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Self-service Faculty/HoD signup — account creation only. The detailed
 * onboarding form (identity, research, etc.) is a separate step completed
 * after first login — middleware routes accounts with status
 * "onboarding_incomplete" to /faculty/onboarding or /hod/onboarding.
 *
 * With Supabase configured, "username" is an email address: the account is
 * created via the Admin API (email pre-confirmed, no confirmation email
 * infra required for this internal app) and a matching profiles row is
 * inserted with status 'onboarding_incomplete'. Without Supabase configured,
 * falls back to the demo in-memory store — see lib/demo-accounts.ts.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const role = String(form.get("role") ?? "");
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const deptId = String(form.get("deptId") ?? "");
  const name = String(form.get("name") ?? "").trim();

  if ((role !== "faculty" && role !== "hod") || !username || !password || !name || !departmentById(deptId)) {
    return NextResponse.redirect(new URL("/signup?error=invalid", request.url), { status: 303 });
  }

  if (isSupabaseConfigured) {
    const admin = createSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: username,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      return NextResponse.redirect(new URL("/signup?error=taken", request.url), { status: 303 });
    }
    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      role,
      dept_id: deptId,
      display_name: name,
      status: "onboarding_incomplete",
      // They chose this password themselves at signup — no forced change.
      must_change_password: false,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.redirect(new URL("/signup?error=taken", request.url), { status: 303 });
    }
    upsertLocalUser({
      id: created.user.id,
      username,
      password: "",
      role,
      displayName: name,
      deptId,
      status: "onboarding_incomplete",
      createdAt: created.user.created_at,
      mustChangePassword: false,
    });

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signInWithPassword({ email: username, password });
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url), { status: 303 });
  }

  let user;
  try {
    user = createUserAccount({ username, password, role, displayName: name, deptId });
  } catch {
    return NextResponse.redirect(new URL("/signup?error=taken", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url), {
    status: 303,
  });
  response.cookies.set(SESSION_COOKIE, `${user.id}|${user.role}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
