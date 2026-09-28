import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./config";

/**
 * Service-role Supabase client — bypasses RLS. Server-only (scripts and
 * Server Actions/Route Handlers), never imported from client code. Used for:
 *  - admin.createUser / admin writes that must skip RLS (Admin's direct-write
 *    actions in lib/actions.ts)
 *  - scripts/seed-supabase.ts and scripts/create-logins.ts
 *  - reading the full dataset at server boot (instrumentation.ts)
 */
// No generated Database type exists for this schema (see supabase/schema.sql,
// hand-maintained rather than introspected), so table rows are typed `any` —
// each call site's mapping functions (lib/supabase/snapshot.ts) and the
// data/types.ts interfaces are the source of truth for shape instead.
let cached: ReturnType<typeof createClient<any>> | null = null;

export function createSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not configured.");
  }
  if (!cached) {
    cached = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
