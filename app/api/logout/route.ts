import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/demo-accounts";

/** Clears the demo session cookie. See app/api/login/route.ts. */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
