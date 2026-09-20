import type { ReactNode } from "react";
import { NotProvided, ProgressBar } from "./ui";

/**
 * Cell renderers for nullable figures.
 *
 * Imported records use null for "the department did not report this", so every
 * table cell has to be able to say so. These keep that rendering identical
 * across the roster, programme, infrastructure and target tables instead of
 * each one inventing its own dash — and they make it impossible to print a
 * bare "null"/"undefined" or a 0 that was never reported.
 *
 * A real 0 still renders as 0. Only null and empty strings are treated as gaps.
 */

const absent = (v: unknown): boolean => v === null || v === undefined || v === "";

/** A number, formatted with thousands separators, or "Not provided". */
export function num(value: number | null | undefined, dp = 0): ReactNode {
  if (absent(value)) return <NotProvided />;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(value as number);
}

/** Free text, or "Not provided". */
export function text(value: string | null | undefined): ReactNode {
  if (absent(value)) return <NotProvided />;
  return value;
}

/** Rupees, or "Not provided". */
export function inr(value: number | null | undefined): ReactNode {
  if (absent(value)) return <NotProvided />;
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(value as number));
}

/** A percentage with its unit, or "Not provided". */
export function pctText(value: number | null | undefined, dp = 1): ReactNode {
  if (absent(value)) return <NotProvided />;
  return `${Number(value).toFixed(dp).replace(/\.0+$/, "")}%`;
}

/**
 * A ratio bar. Needs both halves to mean anything — a fill rate computed from
 * an unreported intake would be fiction, so it shows the gap instead.
 */
export function ratioBar(
  part: number | null | undefined,
  whole: number | null | undefined
): ReactNode {
  if (absent(part) || absent(whole) || !whole) return <NotProvided />;
  return <ProgressBar value={Math.round(((part as number) / (whole as number)) * 100)} />;
}

/** A progress bar from an already-computed percentage. */
export function pctBar(value: number | null | undefined): ReactNode {
  if (absent(value)) return <NotProvided />;
  return <ProgressBar value={value as number} />;
}

/** Signed change between two reported figures; needs both to be meaningful. */
export function delta(
  from: number | null | undefined,
  to: number | null | undefined
): ReactNode {
  if (absent(from) || absent(to)) return <NotProvided />;
  const d = (to as number) - (from as number);
  const tone = d > 0 ? "text-success-700" : d < 0 ? "text-alert-700" : "text-ink-500";
  return (
    <span className={"font-medium tnum " + tone}>
      {d > 0 ? "+" : ""}
      {d}
    </span>
  );
}

/**
 * Sort key for a nullable figure. Returns null so DataTable can push gaps to
 * the end of either sort direction rather than ranking them as zero.
 */
export const sortNum = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) ? null : v;

/** Joins parts as "a / b / c", showing the gap when nothing was reported. */
export function slashed(...parts: (number | null | undefined)[]): ReactNode {
  if (parts.every(absent)) return <NotProvided />;
  return parts.map((p) => (absent(p) ? "—" : String(p))).join(" / ");
}

/* --------------------------------------------------------- string contexts */

/**
 * Plain-string versions, for page subtitles, KPI hints and aria labels where a
 * ReactNode cannot go. Template literals are the trap these exist to close:
 * `${dept.hodName}` prints the word "null" on screen when the HoD cell was
 * blank, which reads as a bug and hides the real gap behind it.
 */
export const asText = (
  v: string | number | null | undefined,
  fallback = "Not provided"
): string => (v === null || v === undefined || v === "" ? fallback : String(v));

/** Joins the parts that exist with `sep`, dropping the ones that do not. */
export function joinMeta(parts: (string | number | null | undefined)[], sep = " · "): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== "").map(String).join(sep);
}

/**
 * A "x of y" style KPI hint. Returns undefined when neither half was reported
 * so the caller drops the hint entirely rather than printing "null of null".
 */
export function pairHint(
  a: number | null | undefined,
  b: number | null | undefined,
  template: (x: string, y: string) => string
): string | undefined {
  if (a == null && b == null) return undefined;
  return template(asText(a, "—"), asText(b, "—"));
}

/** KPI value for an "x / y" pair: null when neither side was reported. */
export function pairValue(
  a: number | null | undefined,
  b: number | null | undefined
): string | null {
  if (a == null && b == null) return null;
  return `${asText(a, "—")} / ${asText(b, "—")}`;
}

/** "adm / intake" — each half falls back to the gap marker independently. */
export function admittedOfIntake(admitted: number | null | undefined, intake: number | null | undefined): ReactNode {
  if (absent(admitted) && absent(intake)) return <NotProvided />;
  return (
    <span className="tnum">
      {absent(admitted) ? <NotProvided /> : admitted} / {absent(intake) ? <NotProvided /> : intake}
    </span>
  );
}
