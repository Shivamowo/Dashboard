# VBSPU Department Data Dashboard

Role-based department performance dashboard for Veer Bahadur Singh Purvanchal University, Jaunpur.
Next.js 14 (App Router) + TypeScript + Tailwind + recharts. **Frontend only — all data is mock
fixtures under `/data`. No backend, no database, no authentication, no persistence.**

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

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

`/data` holds the TypeScript interfaces (`types.ts`) and the seed fixtures:

- `departments.ts` — 4 departments (CSE, IT, ECE, ME)
- `programs.ts` — 5–6 programmes per department, 3 years of fee / intake / admitted figures
- `faculty.ts` — 10–12 faculty per department, each with one research record, 0–2 sponsored
  projects and one annual target sheet
- `infrastructure.ts` — 10–12 labs / classrooms per department
- `submissions.ts` — HoD submission + departmental target summary per department

Values are produced by a seeded deterministic PRNG (`rng.ts`) so figures vary realistically
between faculty and departments while staying stable between server and client renders.

`CURRENT_HOD_DEPT_ID` and `CURRENT_FACULTY_ID` in `data/index.ts` stand in for the session layer —
change them to view the dashboard as a different HoD or faculty member.

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
