# Design.md — VBSPU Brand Application

## 1. Source
vbspu.ac.in renders via JavaScript, so its live CSS palette isn't fetchable directly. The official university seal (provided) is the authoritative brand mark regardless, so the palette below is sampled directly from it — dominant colors extracted from the seal's pink ring, gold trim, water, and sun. Typography is explicitly excluded per your instruction — keep whatever fonts are already in the app.

## 2. Extracted palette
| Token | Hex | Sampled from | Use |
|---|---|---|---|
| `brand-pink` | `#E31C79` | Outer ring, lotus outline | Primary accent — active nav, primary buttons, links, focus rings |
| `brand-pink-dark` | `#96294D` | Ring shadow tone | Hover/pressed state for pink elements, dark-mode pink surfaces |
| `brand-gold` | `#F2C230` | Inner + outer gold trim rings | Secondary accent — borders, dividers, badges, highlight states |
| `brand-teal` | `#2F8F82` | Water in the seal | Tertiary — charts, success-adjacent states, ET/infra section accent |
| `brand-maroon` | `#8B1E3F` | "1987" text, fish detailing | Alert/priority accents (e.g. HoD priority = high, at-risk flags) — do not confuse with system "danger" red, keep as a brand-specific tone |
| `brand-cream` | `#FBF8F3` | Seal's white/parchment field | Light-mode page background (replaces stark white) |
| `brand-ink` | `#1A1210` | — (warm black, not pure black) | Dark-mode surface background (sidebar, header) — warm black keeps the seal's warm palette instead of a cold gray/black |

Logo asset (background removed, transparent PNG) provided separately — place at `/public/vbspu-logo.png`.

## 3. Logo usage
- Use as-is — it's a full-color circular seal with its own internal white field. Never recolor it, never strip it to a single color, never place a colored plate directly behind it that clashes with its pink/gold ring (cream, white, or the dark ink background all work).
- Minimum display size: 32px diameter (sidebar/header), never below 24px.
- Clear space: at least 8px of padding on all sides, no text or UI elements touching the ring.
- Placements: sidebar header (replaces the current "VB" text badge), login page (centered, larger, ~96px), browser favicon (generate from the same asset).

## 4. Where this replaces current UI
| Current element | Change |
|---|---|
| Sidebar "VB" badge | Replace with the actual seal logo (`/public/vbspu-logo.png`) |
| Sidebar background | Warm `brand-ink` instead of pure black |
| Active role card / active nav indicator | `brand-pink` left border + tinted background (currently uses a generic red) |
| Primary buttons, links, focus rings | `brand-pink` |
| Section dividers, table header borders, secondary badges | `brand-gold` |
| ET / infrastructure section accent | `brand-teal` (ties the infra role to the seal's water motif) |
| HoD priority = High / at-risk flags | `brand-maroon` (distinct from the generic red `StatusBadge` "Delayed" state — don't merge the two meanings) |
| Light-mode page background | `brand-cream` instead of pure white |
| Login page | Seal logo centered above the form, `brand-ink` or `brand-cream` background depending on mode, `brand-pink` primary button |

## 5. What's not changing
- Typography — untouched, whatever's already set stays.
- Layout structure, component architecture, routing, RBAC, tour/no-tour decisions from earlier — untouched.
- The neutral gray scale used for body text/borders elsewhere stays as-is; the brand palette layers on top for accents, not as a full re-theme.

## 6. Accessibility check
- `brand-pink` (#E31C79) on `brand-cream` (#FBF8F3): passes for large text/UI elements, verify at build time for body-text-sized usage — prefer `brand-pink-dark` (#96294D) for small text on light backgrounds.
- `brand-gold` (#F2C230) is a highlight/border color only — never use as a text color on light backgrounds (fails contrast). Fine as a border/fill against dark surfaces.
- Keep `brand-maroon` and system "danger" red visually distinct enough that at-risk (brand) vs delayed (system status) don't get confused in the targets tracker — pair each with a text label, not color alone.
