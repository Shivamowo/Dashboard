import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Server-side Supabase client for Server Components, Route Handlers and
 * Server Actions — reads/writes the auth session via the request's cookies.
 * Only call this when isSupabaseConfigured is true (see ./config).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<any>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — middleware refreshes the
          // session cookie instead. Safe to ignore (see @supabase/ssr docs).
        }
      },
    },
  });
}
