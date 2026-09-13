# VBSPU Department Data Dashboard

Role-based department performance dashboard for Veer Bahadur Singh Purvanchal University, Jaunpur.
Next.js (App Router) + TypeScript + Tailwind + recharts. **Frontend only — the real department
returns are imported from Excel into static JSON under `/data/imported`. No backend, no database,
no real authentication, no persistence.**

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```


## Signing in

The app opens at `/login`. Roles are fixed at sign-in and cannot be switched afterwards.

| Username | Password | Opens |
|---|---|---|
| vc-demo | demo123 | /vc |
| registrar-demo | demo123 | /registrar |
| hod-demo | demo123 | /hod |
| faculty-demo | demo123 | /faculty |
| et-demo | demo123 | /et |

**Mock authentication, demo only.** Credentials live in `lib/demo-accounts.ts` in plain text,
nothing is hashed, and the `session` cookie holds the bare role name unsigned — anyone can forge
it. There is no user store, expiry policy, rate limiting or CSRF protection. Replace the whole
auth layer with a real identity provider before any real use.

`middleware.ts` enforces route ownership: a missing or invalid session goes to `/login`; a valid
session in the wrong section is sent to its own home instead. Protected pages are served
`no-store`, so pressing back after logging out bounces to `/login` rather than showing stale
content. The sidebar renders only the signed-in role — the other four are absent from the DOM.

## Roles

Selected from the header switcher (no login). `/` lists all five roles.

| Role | Route | Scope |
|---|---|---|
| Vice Chancellor | `/vc` | All departments — university KPIs, dept comparison, submission compliance, drill dept → faculty |
| Registrar | `/registrar` | All departments — faculty roster, HoD compliance, programme statistics, same drill chain |
| HoD | `/hod` | Own department only (`CURRENT_HOD_DEPT_ID`), drill into own faculty |
| Faculty | `/faculty` | Own record only (`CURRENT_FACULTY_ID`) |
| ET | `/et` | Infrastructure across all departments, nothing else |

Drill-down routes: `/vc/dept/[deptId]`, `/vc/faculty/[facultyId]`,
`/registrar/dept/[deptId]`, `/registrar/faculty/[facultyId]`, `/hod/faculty/[facultyId]`.
Every drill-down page carries a breadcrumb back up its own role chain.

## Data

The dashboard reads the **real department returns**, imported from the workbooks in
`/excel-data` (23 departments, including the six Rajju Bhaiya Institute departments, which are
separate entities from their same-named main-campus counterparts).

```bash
npm run import:excel     # re-reads /excel-data, rewrites /data/imported + /supabase
```

`scripts/import-excel-data.ts` parses all five sheets per workbook and writes one JSON file per
entity to `/data/imported`, plus `completeness-report.json`. It is idempotent — each run
rebuilds every output from scratch, and ids are derived from the source (department slug + row
number) rather than a counter, so they stay stable across runs.

Department identity comes from each workbook's own "Name of Department" / "Name of HoD" cells,
checked across every sheet that carries them. Three workbooks name the department nowhere at all;
those fall back to the filename and are flagged with `nameFromFilename` in both the data and the
report.

### Blank means blank

**A blank cell imports as `null`, never as `0` or `""`.** The workbooks contain real zeros
sitting next to genuinely unreported figures, and collapsing the two would invent data the
departments never submitted. `"NA"`, `"Nil"` and `"--"` are used the way a blank is, so they
import as null too.

Every nullable field renders as a muted gray **"Not provided"** (`components/ui.tsx#NotProvided`)
— deliberately neutral, so it never reads as the brand-gold "Pending approval" badge or the
brand-maroon "At risk" flag, which are states to act on. `components/cells.tsx` holds the shared
cell renderers; `data/nullable.ts` holds null-aware arithmetic, so an average is taken over the
values that were actually reported instead of being dragged toward zero by the blanks.

`data/imported/completeness-report.json` lists, per department and per entity, which required
fields came back blank — plus an `anomalies` array recording cells whose text could not be mapped
onto the field's type (a PhD column reading "Persuing", a smart-board column reading "2 out of 5",
target rows naming a faculty member who is absent from the roster sheet).

### Switching back to the mock generator

The synthetic generator is still in `data/*.ts` and is not loaded at all by default:

```bash
npm run dev:mock         # VBSPU_DATA_SOURCE=mock — 4 invented departments, fully populated
```

Useful for a clean demo reset, or to exercise screens the real returns leave largely blank.
See `data/source.ts`.

### Supabase groundwork (schema only, nothing connected)

`npm run import:excel` also writes:

- `supabase/schema.sql` — one table per entity, columns 1:1 with `data/types.ts`, foreign keys
  for Department 1—many Program/Faculty/Infrastructure and Faculty 1—many FacultyProject /
  1—1 FacultyResearch/FacultyTarget. Every column fed by a spreadsheet cell is nullable, and none
  carries a `DEFAULT` that would turn a blank into a zero.
- `supabase/seed.sql` — the same parsed rows as `INSERT`s, so this dataset can seed a real
  project without reshaping.

There is no Supabase client, no env vars and no live connection yet — this is groundwork only.

## Aggregation

Every rollup (university KPIs, department snapshots, HoD submission snapshot blocks, target
summaries) is computed at render time in `lib/aggregate.ts` and `lib/rows.ts` from the underlying
fixture arrays. No rollup number is stored or hardcoded.

## Design system

Tokens live in `tailwind.config.ts` and are used everywhere — no page invents its own styles.

- **Surfaces** — `paper` (app ground), `paper-raised` (panels), `paper-sunken` (table headers, inset blocks)
- **Ink** — one warm neutral scale for text, rules and the navigation rail
- **Accent** — `seal` (oxblood) is the only interactive and identifying colour; `brass` is a
  non-interactive highlight; `success` / `caution` / `alert` are reserved for status
- **Radius** — `rounded-control` for controls, `rounded-panel` for panels. Nothing else.
- **Elevation** — structure is carried by 1px rules; the single `shadow-raise` is for floating layers only
- **Type** — Spectral (display and figures) with IBM Plex Sans (UI and tables) on a fixed scale,
  `text-micro` through `text-h1`; all figures are tabular
- **Icons** — lucide-react throughout, always `aria-hidden` beside a text label

Accessibility: semantic `table` / `th scope` / `caption` markup, visible focus rings on every
control and clickable row, status conveyed by a label plus a shape cue rather than colour alone,
and `prefers-reduced-motion` respected. Every table and chart has an explicit empty state, and
each route has a `loading.tsx` skeleton.

## Layout

A persistent left rail carries the role switcher; the active role expands to list that view's
sections, so the current page is always evident. Below `lg` the rail collapses into a top bar with
a drawer. Breadcrumbs sit inside the page header block, directly above the title they belong to.

## Components

`RoleSwitcher` (the sidebar navigation), `AppSidebar`, `KpiCard`, `DataTable` (sortable,
filterable, searchable, clickable rows, horizontal scroll with a sticky first column — columns are
never dropped), `TrendChart` (recharts), `ProgressBar`, `StatusBadge`, `Breadcrumb`, `ProfileCard`,
`EmptyState`, skeletons, `FacultyProfileSections`, `DeptDetailSections`, plus the per-sheet tables
under `components/tables/`.

Chart colours live in `components/chartTokens.ts` — the only file with raw colour values, since
recharts cannot take Tailwind classes. The categorical palette is validated for colour-vision-
deficiency separation and for contrast against the panel surface.
