/**
 * Whether real Supabase auth/persistence is configured. False in any clone
 * that hasn't set up a Supabase project yet — lib/session.ts and
 * middleware.ts fall back to the demo cookie system (lib/demo-accounts.ts,
 * data/store.ts) in that case so local dev keeps working without setup.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
