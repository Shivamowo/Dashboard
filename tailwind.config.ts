import type { Config } from "tailwindcss";

/**
 * Design tokens for the VBSPU registry dashboard.
 *
 * The visual language is a university record office: warm paper surfaces, a
 * charcoal ink scale for structure and text, and a single oxblood "seal" accent
 * reserved for interactive and identifying elements. Brass is a secondary,
 * non-interactive highlight (charts, certification marks). Structure is carried
 * by 1px rules rather than shadows.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FBF8F3", // brand-cream
          raised: "#FFFFFF",
          sunken: "#EFEDE8",
        },
        ink: {
          50: "#F6F5F2",
          100: "#EDEBE6",
          200: "#DEDBD4",
          300: "#C2BEB5",
          400: "#9A968C",
          500: "#767268",
          600: "#5A5750",
          700: "#41403B",
          800: "#2C2B28",
          900: "#1E1D1B",
          950: "#141312",
        },
        seal: {
          50: "#FCF4F5",
          100: "#F8E7E9",
          200: "#F0CED3",
          300: "#E0A3AD",
          400: "#C4596A",
          500: "#A63343",
          600: "#8C2332",
          700: "#7A1F2B",
          800: "#63161F",
          900: "#4E1119",
        },
        brass: {
          50: "#FBF6EA",
          100: "#F5EBD6",
          200: "#E8D3A4",
          500: "#B08434",
          600: "#A67A28",
          700: "#8A6420",
        },
        /**
         * VBSPU brand palette, sampled from the university seal (see design.md).
         * These layer on top of the neutral scale as accents — they do not
         * replace it.
         */
        "brand-pink": {
          DEFAULT: "#E31C79",
          50: "#FDF0F6",
          100: "#FBDCEB",
          200: "#F5B4D2",
          dark: "#96294D",
        },
        "brand-gold": {
          DEFAULT: "#F2C230",
          50: "#FEF9EA",
          100: "#FCEFC6",
          200: "#F8E09A",
        },
        "brand-teal": {
          DEFAULT: "#2F8F82",
          50: "#EDF6F4",
          100: "#D3E9E5",
          200: "#A6D3CC",
          dark: "#257268",
        },
        "brand-maroon": {
          DEFAULT: "#8B1E3F",
          50: "#FBEFF3",
          100: "#F4D8E0",
          200: "#E5AFBF",
        },
        "brand-cream": "#FBF8F3",
        "brand-ink": {
          DEFAULT: "#1A1210",
          light: "#2A201D",
          lighter: "#3B2E2A",
        },

        success: { 50: "#EDF7F0", 100: "#D6EDDD", 600: "#1F7A45", 700: "#186137" },
        caution: { 50: "#FDF4E6", 100: "#F9E6C6", 600: "#9A6408", 700: "#7C5006" },
        alert: { 50: "#FDF1F1", 100: "#F9DCDC", 600: "#A82B2B", 700: "#8A2222" },
      },
      borderRadius: {
        // One control radius, one panel radius. Nothing else.
        control: "0.375rem",
        panel: "0.625rem",
      },
      fontFamily: {
        sans: ["var(--font-plex)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-spectral)", "Georgia", "serif"],
      },
      fontSize: {
        // Deliberate scale — 12 / 13 / 14 / 16 / 20 / 26 / 34
        micro: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        meta: ["0.8125rem", { lineHeight: "1.15rem" }],
        body: ["0.875rem", { lineHeight: "1.375rem" }],
        lead: ["1rem", { lineHeight: "1.6rem" }],
        h3: ["1.25rem", { lineHeight: "1.6rem", letterSpacing: "-0.01em" }],
        h2: ["1.625rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        h1: ["2.125rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
      },
      spacing: {
        gutter: "1.5rem",
      },
      boxShadow: {
        // A single, near-invisible lift for floating layers only.
        raise: "0 1px 2px rgba(20, 19, 18, 0.06), 0 8px 24px rgba(20, 19, 18, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
