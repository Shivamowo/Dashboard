/**
 * Runs once when the Next.js server process starts (see
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation).
 * Warms the Supabase snapshot (lib/supabase/snapshot.ts) that data/source.ts
 * merges over the Excel-imported JSON, so the in-memory arrays every page
 * reads from are already Supabase-backed by the time the first request lands.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isSupabaseConfigured } = await import("./lib/supabase/config");
  if (!isSupabaseConfigured) return;

  const { loadSupabaseSnapshot } = await import("./lib/supabase/snapshot");
  try {
    await loadSupabaseSnapshot();
  } catch (err) {
    console.error("[instrumentation] Failed to load Supabase snapshot, falling back to Excel JSON:", err);
  }
}
