# System Design — VBSPU Department Data Dashboard

## 1. Purpose
Central dashboard replacing the per-department HoD Excel submission workflow (Program details, Faculty Details, Infrastructure Utilization, HoD Submission, Faculty Targets sheets). Role-based visibility from Vice Chancellor down to individual Faculty, plus a lateral Infrastructure (ET) role.

Current build phase: **frontend only, dummy data, Next.js**. This doc also captures the full intended system so later phases (real ingestion, DB, API) have a target to build against.

## 2. Role access hierarchy
Each level's view is a superset of the one below it. ET is a separate lateral role.

| Role | Scope |
|---|---|
| VC | All departments — university-wide rollup, drill into any dept → HoD → faculty |
| Registrar | All departments — HoD + faculty across the university, same drill chain as VC, no university comparison charts |
| HoD | Own department only — faculty + programs + infra + targets |
| Faculty | Own record only — profile, research, projects, targets |
| ET | Infrastructure only, across all departments — no faculty/program/target access |

## 3. Data model
Source of truth is the 5 HoD-submission sheets. Every column maps 1:1 to a field — nothing is dropped or summarized at the schema level.

**Entities:** `Department`, `Program` (per-dept, per-programme, 3-year intake/admitted/fee history), `Faculty` (per-dept), `FacultyResearch` (publications, citations, patents — 1:1 with Faculty), `FacultyProject` (sponsored/research projects — 1:many with Faculty), `Infrastructure` (labs/classrooms, per-dept), `HodSubmission` (submission metadata + auto-calculated snapshot, per-dept), `DeptFacultyTargetSummary` (annual target rollup, per-dept), `FacultyTarget` (full annual target row, 1:1 with Faculty), `UserAccount` (role + optional dept/faculty scope).

**Relationships:**
- `Department` 1—many `Program`, `Faculty`, `Infrastructure`
- `Faculty` 1—many `FacultyProject`, 1—1 `FacultyResearch`, 1—1 `FacultyTarget`
- `UserAccount` many—0/1 `Department`, many—0/1 `Faculty` (only when role = Faculty)

Full field-level schema lives in `PRD_VBSPU_Dashboard_Frontend.md` section 3 — that's the canonical version; keep both in sync.

## 4. Aggregation rules
Numbers are never entered twice — every rollup is computed from the underlying rows:
- Dept-level (HoD view) = SUM/AVG of that dept's `Faculty`, `Program`, `Infrastructure` rows.
- University-level (VC/Registrar view) = SUM/AVG across all `Department` rollups.
- Infra utilisation (ET view) = per-room %, independent of the faculty/program chain.
- `HodSubmission.snapshot` fields are themselves rollups (no. of programmes, total faculty, faculty with PhD, etc.) — recompute them, don't trust a stored value once real data lands.

## 5. Screens per role
| Role | Sections |
|---|---|
| VC | University KPI cards → dept comparison table (sortable) → submission compliance list → drill: dept detail → faculty full profile |
| Registrar | University-wide faculty roster (filterable) → HoD compliance list → program stats trend → same drill chain as VC |
| HoD | Dept snapshot KPIs → faculty roster w/ research summary → program table (full fields) → targets tracker (all faculty, at-risk flagged) → infra table → HoD submission card |
| Faculty | Own full profile: identity & teaching, research output, sponsored projects, annual targets (quarterly plan/status/remarks) |
| ET | Infra table across all depts (full fields, filterable by dept), utilisation flagged under/over |

Dept detail and faculty profile pages are shared components reused by VC, Registrar, and HoD — only the data scope and the "back" breadcrumb target differ.

## 6. Navigation / drill-down
```
Role home → Department row → Department detail (Programs / Infra / HoD Submission / Faculty roster)
                                       → Faculty row → Faculty full profile
```
Faculty and ET roles skip the department-list step — they land directly on their own scoped view.

## 7. Presentation conventions
- KPI cards for aggregate numbers.
- Sortable/filterable tables for rosters and infra lists — wide tables scroll horizontally, columns are never hidden.
- Line/bar charts for trends (intake vs admitted by year, publications by year).
- Progress bars for milestone achievement %.
- Color-coded status badges for quarterly status (On track / At risk / Delayed) and infra utilisation (under/over-utilised).
- Breadcrumb nav on every drill-down page.

## 8. Intended full-system architecture (post frontend-only phase)
```
Dept HoD excel files  →  Ingestion / ETL (parses, validates, normalises)
                       →  Central DB — single source of truth
                       →  API layer — role-based access control (row-scoped by dept_id + role)
                       →  Dashboard (this frontend) — role-specific views
```
RBAC in the API layer is row scoping on `dept_id` plus a role check: VC/Registrar get `dept_id = *`, HoD/Faculty get scoped to their own, ET gets `Infrastructure` across all depts and nothing else. Not built in the current phase — frontend runs entirely on mock fixtures under `/data` until this lands.

## 9. Current phase scope
Frontend only. No auth, no real DB, no API calls, no persistence, no write actions. Role is chosen via a header switcher, not a login. See `PRD_VBSPU_Dashboard_Frontend.md` for the field-complete build spec and the Claude Code prompt used to generate it.
