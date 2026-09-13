/**
 * Arithmetic over nullable figures.
 *
 * Imported records carry null for "the department did not report this", which
 * is not the same as zero (see the nullability contract in ./types.ts). Plain
 * `a + b` would quietly coerce null to 0, and an average over a list containing
 * nulls would divide by the wrong count — understating every rate on the
 * dashboard. These helpers skip nulls instead, and return null when there was
 * nothing to work with, so "no data" stays distinguishable from "zero".
 */

/** Sum, ignoring nulls. Returns null when no value was reported at all. */
export function sumOf<T>(rows: T[], pick: (row: T) => number | null | undefined): number | null {
  let total = 0;
  let seen = false;
  for (const row of rows) {
    const v = pick(row);
    if (v == null || !Number.isFinite(v)) continue;
    total += v;
    seen = true;
  }
  return seen ? total : null;
}

/** Mean of the reported values only. Returns null when none were reported. */
export function avgOf<T>(
  rows: T[],
  pick: (row: T) => number | null | undefined,
  dp = 1
): number | null {
  let total = 0;
  let count = 0;
  for (const row of rows) {
    const v = pick(row);
    if (v == null || !Number.isFinite(v)) continue;
    total += v;
    count++;
  }
  if (!count) return null;
  const f = 10 ** dp;
  return Math.round((total / count) * f) / f;
}

/** Counts rows whose flag is explicitly true; null (unreported) never counts. */
export const countTrue = <T>(rows: T[], pick: (row: T) => boolean | null | undefined): number =>
  rows.reduce((n, row) => (pick(row) === true ? n + 1 : n), 0);

/** Adds nullable figures, returning null only when every part is null. */
export function addNullable(...parts: (number | null | undefined)[]): number | null {
  let total = 0;
  let seen = false;
  for (const p of parts) {
    if (p == null || !Number.isFinite(p)) continue;
    total += p;
    seen = true;
  }
  return seen ? total : null;
}

/** A percentage, or null when the parts needed to compute one are missing. */
export function pctOf(part: number | null, whole: number | null, dp = 1): number | null {
  if (part == null || whole == null || whole === 0) return null;
  const f = 10 ** dp;
  return Math.round((part / whole) * 100 * f) / f;
}

/** Treats null as zero — only for sums where an unreported figure adds nothing. */
export const orZero = (v: number | null | undefined): number =>
  v == null || !Number.isFinite(v) ? 0 : v;
