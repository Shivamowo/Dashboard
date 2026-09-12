import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/demo-accounts";
import { createChangeRequest, createUserAccount, departmentById } from "@/data";

/**
 * Self-service Faculty/HoD signup — see SYSTEM_DESIGN.md and DEMO-ONLY notes in
 * app/api/login/route.ts. Creates the user account immediately (so they can
 * sign in right away) plus a pending 'onboarding' ChangeRequest; the actual
 * Faculty/HoD record is only created once Admin approves it.
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

  if (role === "faculty") {
    createChangeRequest({
      type: "onboarding",
      targetEntity: "Faculty",
      targetId: null,
      submittedByUserId: user.id,
      submittedByRole: "faculty",
      deptId,
      section: "profile",
      payload: {
        name,
        designation: String(form.get("designation") ?? "Assistant Professor"),
        appointmentType: String(form.get("appointmentType") ?? "Regular"),
        dateOfJoining: String(form.get("dateOfJoining") ?? ""),
        hasPhd: form.get("hasPhd") === "on",
        programmesAppointedFor: String(form.get("programmesAppointedFor") ?? ""),
        teachingLoadHrsPerWeek: Number(form.get("teachingLoadHrsPerWeek") ?? 0),
        additionalResponsibility: String(form.get("additionalResponsibility") ?? "NA"),
      },
    });
  } else {
    createChangeRequest({
      type: "onboarding",
      targetEntity: "HoD",
      targetId: null,
      submittedByUserId: user.id,
      submittedByRole: "hod",
      deptId,
      payload: {
        name,
        mobileContact: String(form.get("mobileContact") ?? ""),
      },
    });
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
