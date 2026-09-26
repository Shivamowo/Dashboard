import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/demo-accounts";
import { findUserByCredentials } from "@/data";

/**
 * DEMO-ONLY MOCK AUTH — NOT FOR PRODUCTION.
 *
 * Accounts (demo and self-service signups) live in data/store.ts and are
 * compared in plain text. The cookie holds "<userId>|<role>" and is neither
 * signed nor encrypted, so anyone can forge it. There is no rate limiting or
 * CSRF protection. Replace with a real identity provider before any real use.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  const user = findUserByCredentials(username, password);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
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
