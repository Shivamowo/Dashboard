/**
 * Chart colour tokens — VBSPU brand (see design.md).
 *
 * Recharts takes concrete colour values rather than class names, so these mirror
 * the Tailwind theme in one place. The categorical order is fixed (never cycled)
 * and validated for colour-vision-deficiency separation and contrast against the
 * cream surface.
 *
 * brand-gold and the seal's teal are darkened here for plotting only: the brand
 * gold (#F2C230) and teal (#2F8F82) fail contrast / chroma as data marks on a
 * light ground. They stay untouched as borders and fills elsewhere.
 */
export const CHART_SERIES = ["#E31C79", "#B8860B", "#0E8F80"] as const;

export const CHART_AXIS = "#767268"; // ink-500
export const CHART_GRID = "#EDEBE6"; // ink-100
export const CHART_INK = "#41403B"; // ink-700
export const CHART_SURFACE = "#FFFFFF"; // paper-raised
