declare global {
  // eslint-disable-next-line no-var
  var __vbspuGlobalStore: Record<string, unknown> | undefined;
}

/**
 * Next.js compiles Route Handlers, Server Components and Server Actions into
 * separate module graphs (especially under Turbopack in dev) — a plain
 * `export const x = []` in a shared module is NOT guaranteed to be the same
 * array instance across them. Anchoring state on `globalThis` (the one true
 * process-wide object) works around that, which is what every mutable array
 * in the data layer relies on for the in-memory demo store to behave
 * correctly across api routes, pages and server actions alike.
 */
export function globalSingleton<T>(key: string, init: () => T): T {
  const store = (globalThis.__vbspuGlobalStore ??= {}) as Record<string, T>;
  if (!(key in store)) store[key] = init();
  return store[key];
}
