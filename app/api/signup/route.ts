import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/demo-accounts";
import { createUserAccount, departmentById } from "@/data";

/**
 * Self-service Faculty/HoD signup — account creation only. See DEMO-ONLY notes
 * in app/api/login/route.ts. The detailed onboarding form (identity, research,
 * etc.) is a separate step the user completes after first login — middleware
 * routes accounts with status "onboarding_incomplete" to
 * /faculty/onboarding or /hod/onboarding until that's done.
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
