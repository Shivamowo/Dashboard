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

/**
 * Keep people signed in: the auth cookie persists 30 days (browser restarts
 * included). The short-lived access token is silently refreshed by
 * middleware.ts on every protected request using the refresh token, so users
 * only re-login after 30 days of no visits, an explicit logout, or a password reset.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE_OPTIONS = {
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
