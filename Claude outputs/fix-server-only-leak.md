# Fix: server-only Supabase client leaking into a Client Component (build failure)

Build fails on Vercel with a "Client Component Browser" / "Client Component SSR" import-trace error rooted at `lib/supabase/admin.ts`. Chain: `components/tables/ProgramStatsTable.tsx` (Client Component) → `data/index.ts` → `data/store.ts` → `lib/supabase/snapshot.ts` → `lib/supabase/admin.ts` (the service-role Supabase client). Next.js refuses the build because that chain would ship `SUPABASE_SERVICE_ROLE_KEY`-holding code to the browser bundle.

Root cause: `ProgramStatsTable.tsx` is a client component (needs sorting/filtering interactivity) but imports the full `@/data` module for types or helper functions, which transitively pulls in the admin Supabase client.

## Fix (do this, not a band-aid)

1. **Find every Client Component that imports from `@/data`, `data/store.ts`, or `lib/supabase/snapshot.ts` directly** — `ProgramStatsTable.tsx` is confirmed, grep for others (`"use client"` files importing `@/data`).
2. **Stop them importing the data layer at all.** A client component should receive its rows as props from the server component that renders it. In `app/registrar/page.tsx` (a Server Component — safe to import `@/data`), fetch/compute the data server-side and pass it as a typed prop into `<ProgramStatsTable rows={...} />`. Do this for every affected table/component, not just this one page.
3. **If a client component only needs a TYPE from `@/data`** (not a runtime function), split the type into its own file with zero runtime imports (e.g. `data/types.ts` already exists and should have no import of `store.ts`/`snapshot.ts`/`admin.ts` — confirm it doesn't, and import types from there instead of the barrel `data/index.ts`).
4. **Harden the boundary going forward**: add `import "server-only";` as the first line of `lib/supabase/admin.ts` (and `lib/supabase/snapshot.ts` if it also touches the service-role client) — `server-only` is a zero-cost package that turns this exact mistake into an immediate, clear build error the next time someone accidentally imports it from client code, instead of the cryptic dual-trace output.
5. Re-run `npm run build` locally before pushing — confirm it's clean, then push.

Scope: only touch the client/server data-flow boundary for components affected by this leak. Don't refactor the data layer's actual logic.
