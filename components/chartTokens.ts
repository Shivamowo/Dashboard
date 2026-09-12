/**
 * Chart colour tokens.
 *
 * Recharts takes concrete colour values rather than class names, so these mirror
 * the Tailwind theme in one place — the only file where raw colour values live.
 * The categorical order is fixed (never cycled) and validated for colour-vision
 * -deficiency separation and contrast against the raised paper surface.
 */
export const CHART_SERIES = ["#A63343", "#B08434", "#0284A8"] as const;

export const CHART_AXIS = "#767268"; // ink-500
export const CHART_GRID = "#EDEBE6"; // ink-100
export const CHART_INK = "#41403B"; // ink-700
export const CHART_SURFACE = "#FFFFFF"; // paper-raised
