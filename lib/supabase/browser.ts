import { createBrowserClient } from "@supabase/ssr";
import { SESSION_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Supabase client for Client Components. Only used where a page needs live
 * client-side auth state; most of the app reads/writes via Server Actions. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<any>(SUPABASE_URL!, SUPABASE_ANON_KEY!, { cookieOptions: SESSION_COOKIE_OPTIONS });
}
