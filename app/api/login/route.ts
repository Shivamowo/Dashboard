import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, findAccount } from "@/lib/demo-accounts";

/**
 * DEMO-ONLY MOCK AUTH — NOT FOR PRODUCTION.
 *
 * Credentials are hardcoded in lib/demo-accounts.ts and compared in plain text.
 * The cookie holds the bare role name and is neither signed nor encrypted, so
 * anyone can forge it. There is no user store, rate limiting or CSRF protection.
 * Replace with a real identity provider before any real use.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  const account = findAccount(username, password);
  if (!account) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL(ROLE_HOME[account.role], request.url), {
    status: 303,
  });
  response.cookies.set(SESSION_COOKIE, account.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
