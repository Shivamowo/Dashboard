import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/demo-accounts";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Signs out of Supabase Auth when configured, else clears the demo cookie. */
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
