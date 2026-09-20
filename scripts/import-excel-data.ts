/**
 * Imports the department workbooks in /excel-data into normalized JSON under
 * /data/imported, plus a completeness report and the Supabase seed SQL.
 *
 *   npm run import:excel
 *
 * Idempotent: every run rebuilds the output files from scratch, so re-running
 * overwrites rather than appending. Ids are derived from the source (department
 * slug + row number), never from a counter, so they are stable across runs.
 *
 * THE CENTRAL RULE: a blank cell becomes null, never 0 and never "". The
 * workbooks contain real zeros next to genuinely unreported figures, and
 * collapsing the two would invent data. Everything downstream renders null as
 * "Not provided". See the nullability contract in data/types.ts.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import type {
  Department,
  DeptFacultyTargetSummary,
  Faculty,
  FacultyProject,
  FacultyResearch,
  FacultyTarget,
  HodSubmission,
  Infrastructure,
  Program,
} from "../data/types";

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "excel-data");
const OUT_DIR = path.join(ROOT, "data", "imported");
const SUPABASE_DIR = path.join(ROOT, "supabase");

/** The master workbook defines the schema and holds no department data. */
const MASTER_MARKER = "Master";

const SHEETS = {
  program: "Program details",
  faculty: "Faculty Details",
  infra: "Infrastructure Utilization",
  hod: "HoD Submission",
  targets: "Faculty Targets",
} as const;

/**
 * Header rows confirmed against the master workbook (1-based, absolute).
 * Data begins after the header, but blank spacer rows occur between the header
 * and the first record, so readers skip rows rather than trusting a fixed start.
 */
const HEADER_ROW = {
  program: 4, // merged 2-level header on rows 3-4
  faculty: 5, // merged 3-level header on rows 3-5
  infra: 4,
  targets: 9, // merged 2-level header on rows 8-9
} as const;

/* ------------------------------------------------------------------ cells */

/**
 * Text that means "no value", not a value. "NA"/"Nil"/"--" are used by the
 * workbooks the way a blank is, so they import as null — asserting 0 sanctioned
 * professors because a cell said "Nil" would state a fact nobody reported.
 * Recorded in the completeness report so the distinction stays auditable.
 */
const NULL_TOKENS = new Set([
  "",
  "-",
  "--",
  "---",
  "na",
  "n/a",
  "n.a.",
  "nil",
  "none",
  "not applicable",
  "not available",
  "nan",
  "null",
  "undefined",
  "tbd",
  "no data",
]);

type Cell = string | number | boolean | Date | null | undefined;

const clean = (v: Cell): string | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).replace(/\s+/g, " ").trim();
  if (NULL_TOKENS.has(s.toLowerCase())) return null;
  return s === "" ? null : s;
};

/** Free text exactly as written, minus whitespace noise and null tokens. */
const str = (v: Cell): string | null => clean(v);

/**
 * Numbers as the workbooks actually write them: "₹61,000", "3,85,000.00",
 * "5.96 Lakhs", "Rs. 291500/-", "60+6(EWS)". Returns null when the cell holds
 * something that is not a quantity at all (e.g. "Beam Time").
 */
function num(v: Cell): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return null;
  const s = clean(v);
  if (s == null) return null;

  const lower = s.toLowerCase();
  // "5.96 Lakhs" / "2.5 crore" — scale words, common in the funding columns.
  const scaled = lower.match(/(-?[\d,]+(?:\.\d+)?)\s*(lakh|lac|crore)/);
  if (scaled) {
    const base = Number(scaled[1].replace(/,/g, ""));
    if (!Number.isFinite(base)) return null;
    return scaled[2] === "crore" ? base * 1e7 : base * 1e5;
  }

  // "60+6(EWS)" — an additive expression; sum the parts (60+6 = 66 intake).
  const bare = s.replace(/\([^)]*\)/g, "");
  if (/^\s*-?[\d,.]+(\s*\+\s*[\d,.]+)+\s*$/.test(bare)) {
    const parts = bare.split("+").map((x) => Number(x.replace(/,/g, "").trim()));
    if (parts.every((n) => Number.isFinite(n))) return parts.reduce((a, b) => a + b, 0);
  }

  // Strip currency symbols, separators and trailing "/-" then read what is left.
  const stripped = bare
    .replace(/(?:₹|rs\.?|inr)/gi, "")
    .replace(/\/-\s*$/, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();
  if (!/\d/.test(stripped)) return null;
  // Reject text that merely contains a number ("3 Year", "Co-PI with Dr. X").
  if (!/^-?\d+(\.\d+)?$/.test(stripped)) return null;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
}

/** An integer count; rejects fractional junk but keeps real zeros. */
function int(v: Cell): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

type Anomaly = { dept: string; entity: string; field: string; value: string; note: string };
const anomalies: Anomaly[] = [];
const noteAnomaly = (a: Anomaly) => anomalies.push(a);

/**
 * Yes/No cells. Anything else (e.g. "Persuing", "As per BCI", "2 out of 5") is
 * not a boolean, so it returns null and is recorded as an anomaly rather than
 * being forced to false — which would silently claim the opposite.
 */
function bool(v: Cell, ctx?: { dept: string; entity: string; field: string }): boolean | null {
  const s = clean(v);
  if (s == null) return null;
  const l = s.toLowerCase();
  if (["yes", "y", "true", "1"].includes(l)) return true;
  if (["no", "n", "false", "0"].includes(l)) return false;
  if (ctx) noteAnomaly({ ...ctx, value: s, note: "not a yes/no value; imported as null" });
  return null;
}

/**
 * Dates arrive either as Excel serial numbers or as dd/mm/yyyy text. Returns
 * ISO yyyy-mm-dd when it parses, otherwise the original text (a date we cannot
 * normalise is still information worth keeping).
 */
function date(v: Cell): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d && d.y) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    }
    return null;
  }
  const s = clean(v);
  if (s == null) return null;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    let year = Number(yy);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const day = Number(dd);
    const mon = Number(mm);
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  return s;
}

/* ----------------------------------------------------------------- sheets */

type Grid = Cell[][];

/**
 * Reads a sheet as an absolutely-indexed grid. Forcing the range origin to A1
 * matters: several workbooks have a !ref starting at A2 (the Infrastructure
 * sheet in particular), which would otherwise shift every row by one and make
 * the documented header rows point at the wrong line.
 */
function grid(ws: XLSX.WorkSheet | undefined): Grid {
  if (!ws || !ws["!ref"]) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  range.s.r = 0;
  range.s.c = 0;
  return XLSX.utils.sheet_to_json<Cell[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
    range,
  });
}

const at = (g: Grid, row1: number, col0: number): Cell => {
  const r = g[row1 - 1];
  return r ? (r[col0] ?? null) : null;
};

const rowHasData = (r: Cell[] | undefined) =>
  !!r && r.some((c) => clean(c) != null);

/** Data rows after a header row, skipping blank spacers and stray footers. */
function dataRows(g: Grid, headerRow1: number): { row: Cell[]; index: number }[] {
  const out: { row: Cell[]; index: number }[] = [];
  for (let i = headerRow1; i < g.length; i++) {
    const row = g[i];
    if (!rowHasData(row)) continue;
    out.push({ row: row as Cell[], index: i + 1 });
  }
  return out;
}

/** Labels that must never be mistaken for a value when the value cell is blank. */
const KNOWN_LABELS = new Set(
  [
    "Name of Faculty",
    "Name of Department",
    "Name of Dean",
    "Name of HoD",
    "Mobile / Contact No.",
    "Date of Submission",
    "Reporting Period",
    "Review Period",
    "Current Weekly Working Hours / Room",
    "Designation",
    "Indicator",
    "Reported Value",
  ].map((s) => s.toLowerCase())
);

/**
 * Finds a label in a sheet's header block and returns the value to its right.
 *
 * Restricted to the top rows because the data headers further down reuse the
 * same words ("Designation" on the Faculty Targets header row would otherwise
 * be picked up as the value for "Name of Faculty"). Stops at the next label so
 * a blank value cell returns null instead of borrowing the neighbouring label.
 */
function headerValue(g: Grid, label: string, maxRow = 6): string | null {
  const want = label.toLowerCase();
  for (let r = 0; r < Math.min(g.length, maxRow); r++) {
    const row = g[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (clean(row[c])?.toLowerCase() !== want) continue;
      for (let k = c + 1; k < Math.min(row.length, c + 10); k++) {
        const v = clean(row[k]);
        if (v == null) continue;
        if (KNOWN_LABELS.has(v.toLowerCase())) break; // hit the next label: no value
        return v;
      }
    }
  }
  return null;
}

/** Looks up a label anywhere in a two-column label/value sheet. */
function pairValue(g: Grid, label: string): Cell {
  const want = label.toLowerCase();
  for (const row of g) {
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (clean(row[c])?.toLowerCase() !== want) continue;
      for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
        const v = row[k];
        if (clean(v) != null && !KNOWN_LABELS.has(String(clean(v)).toLowerCase())) return v;
      }
      return null;
    }
  }
  return null;
}

/* ------------------------------------------------------------- identities */

/** Url-safe id from a department name, trimmed at a word boundary. */
function slug(s: string): string {
  const full = s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (full.length <= 48) return full || "dept";
  // Cut at the last complete word so ids never end mid-word ("…-departme").
  const cut = full.slice(0, 48);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 16 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "") || "dept";
}

/**
 * Compact label for sidebars and table columns: "Mechanical Engineering" -> "ME".
 *
 * Parenthesised qualifiers are dropped first — "Mathematics (Rajju Bhaiya
 * Institute)" must not become "M(BI" — and leading "Department of"/"Centre for"
 * is stripped so the initials come from the words that actually distinguish
 * one department from another. Dotted abbreviations already in the source
 * ("H.R.D.") are kept as their letters rather than re-initialised.
 */
function shortNameOf(name: string): string {
  const base = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/^(department|centre|center|institute|school)\s+(of|for)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // "H.R.D." / "B.C.A." — the dots already mark the initials.
  if (/^(?:[A-Za-z]\.){2,}$/.test(base.replace(/\s/g, ""))) {
    return base.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5);
  }

  const stop = /^(and|the|of|for|its?|in|on|to|de)$/i;
  const words = base.split(/[\s&/,\-–]+/).filter((w) => /[A-Za-z]/.test(w) && !stop.test(w));
  if (!words.length) return base.slice(0, 4).toUpperCase() || "DEPT";
  if (words.length === 1) return words[0].replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0] ?? "")
    .join("")
    .toUpperCase();
}

/** "Rajju Bhaiya- Maths.xlsx" -> "Rajju Bhaiya Maths" */
function nameFromFile(file: string): string {
  return file
    .replace(/\.xlsx$/i, "")
    .replace(/[-_]?Deptt?\s*Data/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The Rajju Bhaiya institute is a separate constituent unit whose departments
 * duplicate main-campus names (Physics, Chemistry, Mathematics). Its files are
 * flagged so ids stay unique and the UI can tell the two Physics departments
 * apart.
 */
const isRajjuBhaiya = (file: string) => /rajju\s*bhaiya/i.test(file);
const RAJJU_UNIT = "Prof. Rajendra Singh (Rajju Bhaiya) Institute of Physical Sciences for Study and Research";

/* -------------------------------------------------------------- reporting */

interface EntityGaps {
  total: number;
  blankByField: Record<string, number>;
}
interface DeptReport {
  deptId: string;
  department: string;
  sourceFile: string;
  nameFromFilename: boolean;
  counts: Record<string, number>;
  missingEntities: string[];
  entities: Record<string, EntityGaps>;
}

/** Fields whose absence actually matters, per entity. */
const REQUIRED: Record<string, string[]> = {
  department: ["facultyOfEngineering", "name", "deanName", "hodName", "hodContact", "dateOfSubmission"],
  program: ["name", "yearOfCommencement", "modeOfProgramme", "nepAligned"],
  faculty: ["name", "designation", "appointmentType", "dateOfJoining", "hasPhd", "teachingLoadHrsPerWeek"],
  facultyResearch: ["hIndex", "i10Index", "googleScholarOrcidLink"],
  facultyProject: ["sponsoringAgency", "yearOfGrant", "sanctionedAmount", "currentStatus"],
  infrastructure: ["labClassroomName", "floorRoomNo", "studentCapacity", "utilisationPct"],
  hodSubmission: ["mobileContact", "dateOfSubmission", "certificationSignedBy"],
  facultyTargetSummary: ["reviewPeriod", "totalFacultyPlanned"],
  facultyTarget: ["designation", "milestoneAchievementPct", "hodPriority", "q1Status"],
};

/** Counts blank required fields, walking one level into nested objects. */
function countBlanks(entity: string, records: Record<string, unknown>[]): EntityGaps {
  const fields = REQUIRED[entity] ?? [];
  const blankByField: Record<string, number> = {};
  for (const f of fields) blankByField[f] = 0;
  for (const rec of records) {
    for (const f of fields) {
      const v = rec[f];
      if (v === null || v === undefined) blankByField[f]++;
    }
  }
  return { total: records.length, blankByField };
}

/* ----------------------------------------------------------------- parsing */

interface Parsed {
  department: Department;
  programs: Program[];
  faculty: Faculty[];
  research: FacultyResearch[];
  projects: FacultyProject[];
  infrastructure: Infrastructure[];
  hodSubmission: HodSubmission;
  targetSummary: DeptFacultyTargetSummary;
  targets: FacultyTarget[];
  report: DeptReport;
}

function parseWorkbook(file: string): Parsed {
  const wb = XLSX.readFile(path.join(SRC_DIR, file), { cellDates: false });
  const sheet = (name: string) => grid(wb.Sheets[name]);

  const gProgram = sheet(SHEETS.program);
  const gFaculty = sheet(SHEETS.faculty);
  const gInfra = sheet(SHEETS.infra);
  const gHod = sheet(SHEETS.hod);
  const gTargets = sheet(SHEETS.targets);

  const missingEntities: string[] = [];
  for (const [key, name] of Object.entries(SHEETS)) {
    if (!wb.Sheets[name]) missingEntities.push(key);
  }

  /**
   * Department identity comes from the workbook's own cells, checked across
   * every sheet that carries it — several files leave the HoD Submission block
   * blank but name the department on Program details.
   */
  const firstOf = (label: string) =>
    (pairValue(gHod, label) != null ? clean(pairValue(gHod, label)) : null) ??
    headerValue(gProgram, label) ??
    headerValue(gFaculty, label) ??
    headerValue(gInfra, label) ??
    headerValue(gTargets, label);

  const rajju = isRajjuBhaiya(file);
  let deptName = firstOf("Name of Department");
  let nameFromFilename = false;
  if (!deptName) {
    // Last resort only: three workbooks name the department nowhere at all.
    deptName = nameFromFile(file);
    nameFromFilename = true;
  }
  const displayName = rajju && !/rajju/i.test(deptName) ? `${deptName} (Rajju Bhaiya Institute)` : deptName;
  const deptId = slug(rajju && !/rajju/i.test(deptName) ? `rb-${deptName}` : deptName);

  const facultyOf = firstOf("Name of Faculty") ?? (rajju ? RAJJU_UNIT : null);
  const hodName = firstOf("Name of HoD");
  const deanName = firstOf("Name of Dean");
  const contact = clean(pairValue(gHod, "Mobile / Contact No."));
  const submissionDate = date(pairValue(gHod, "Date of Submission"));
  const reportingPeriod = headerValue(gFaculty, "Reporting Period") ?? headerValue(gProgram, "Reporting Period");
  const reviewPeriod = headerValue(gTargets, "Review Period");

  const ctx = (entity: string, field: string) => ({ dept: displayName, entity, field });

  const department: Department = {
    id: deptId,
    facultyOfEngineering: facultyOf,
    name: displayName,
    shortName: shortNameOf(displayName),
    deanName,
    hodName,
    hodContact: contact,
    reportingPeriod,
    dateOfSubmission: submissionDate,
    ...(nameFromFilename ? { nameFromFilename: true } : {}),
  };

  /* --------------------------------------------------------- Program details
   * Columns A..V; Q (index 16) sits under a merged heading and is unused. */
  const programs: Program[] = dataRows(gProgram, HEADER_ROW.program)
    .filter(({ row, index }) => {
      if (str(row[1]) != null) return true;
      // A row with figures but no programme name is not a programme. Recorded
      // rather than dropped silently so the discard stays auditable.
      noteAnomaly({
        dept: displayName,
        entity: "program",
        field: "name",
        value: `sheet row ${index}`,
        note: "row carries data but no programme name; not imported",
      });
      return false;
    })
    .map(({ row }, i) => ({
      id: `${deptId}-p${i + 1}`,
      deptId,
      sNo: int(row[0]) ?? i + 1,
      name: str(row[1]) as string,
      yearOfCommencement: int(row[2]),
      modeOfProgramme: str(row[3]),
      sanctionedFacultyPositions: {
        professor: int(row[4]),
        associateProfessor: int(row[5]),
        assistantProfessor: int(row[6]),
      },
      semesterFeeByYear: { y2024: num(row[7]), y2025: num(row[8]), y2026: num(row[9]) },
      sanctionedIntakeByYear: { y2024: int(row[10]), y2025: int(row[11]), y2026: int(row[12]) },
      admittedByYear: { y2024: int(row[13]), y2025: int(row[14]), y2026: int(row[15]) },
      nepAligned: bool(row[17], ctx("program", "nepAligned")),
      multipleEntryExit: bool(row[18], ctx("program", "multipleEntryExit")),
      internshipEndOfYear: bool(row[19], ctx("program", "internshipEndOfYear")),
      minorSpecialisationAvailable: bool(row[20], ctx("program", "minorSpecialisationAvailable")),
      remarks: str(row[21]),
    }));

  /* --------------------------------------------------------- Faculty Details
   * One row carries the member, their research totals and one project. A row
   * with project columns but no name is a continuation row: a second project
   * for the member above, not a new person. */
  const faculty: Faculty[] = [];
  const research: FacultyResearch[] = [];
  const projects: FacultyProject[] = [];

  const PROJ_COLS = [20, 21, 22, 23, 24, 25];
  let currentFacultyId: string | null = null;
  let facultySeq = 0;

  for (const { row } of dataRows(gFaculty, HEADER_ROW.faculty)) {
    const name = str(row[1]);
    const hasProject = PROJ_COLS.some((c) => str(row[c]) != null);

    if (name != null) {
      facultySeq++;
      const id = `${deptId}-f${facultySeq}`;
      currentFacultyId = id;
      faculty.push({
        id,
        departments: [deptId],
        primaryDepartment: deptId,
        sNo: int(row[0]) ?? facultySeq,
        name,
        designation: normaliseDesignation(str(row[2])),
        appointmentType: normaliseAppointment(str(row[3])),
        dateOfJoining: date(row[4]),
        hasPhd: bool(row[5], ctx("faculty", "hasPhd")),
        programmesAppointedFor: str(row[6]),
        teachingLoadHrsPerWeek: num(row[7]),
        additionalResponsibility: str(row[8]),
      });
      research.push({
        id: `${id}-res`,
        facultyId: id,
        journalPublications: {
          sciScieSsci: int(row[9]),
          scopusUgcCare: int(row[10]),
          other: int(row[11]),
        },
        conferencePublications: { international: int(row[12]), national: int(row[13]) },
        hIndex: int(row[14]),
        i10Index: int(row[15]),
        googleScholarOrcidLink: str(row[16]),
        patents: { filed: int(row[17]), published: int(row[18]), granted: int(row[19]) },
        phdSupervision: { registered: int(row[26]), awarded: int(row[27]) },
        // The workbooks carry no year-wise series; the trend chart renders its
        // own empty state rather than plotting an invented curve.
        yearly: [],
      });
    }

    if (hasProject && currentFacultyId) {
      const agency = str(row[20]);
      // Guard against template filler: a numeric 0 in the agency column is not
      // an agency, and rows reading "Not Started" with no agency are not grants.
      if (agency != null && !/^\d+$/.test(agency)) {
        projects.push({
          id: `${currentFacultyId}-pr${projects.filter((p) => p.facultyId === currentFacultyId).length + 1}`,
          facultyId: currentFacultyId,
          sponsoringAgency: agency,
          yearOfGrant: int(row[21]),
          duration: str(row[22]),
          sanctionedAmount: num(row[23]),
          amountReleased: num(row[24]),
          currentStatus: str(row[25]),
        });
      }
    }
  }

  /* ----------------------------------------------- Infrastructure Utilization
   * "Current Weekly Working Hours / Room" is a department-level figure in the
   * sheet header, not a per-row column, so every row carries the same value. */
  const weeklyHours = num(
    (() => {
      for (let r = 0; r < Math.min(gInfra.length, 6); r++) {
        const row = gInfra[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          if (clean(row[c])?.toLowerCase() === "current weekly working hours / room") {
            for (let k = c + 1; k < Math.min(row.length, c + 8); k++) {
              const v = row[k];
              if (clean(v) != null && !KNOWN_LABELS.has(String(clean(v)).toLowerCase())) return v;
            }
          }
        }
      }
      return null;
    })()
  );

  const infrastructure: Infrastructure[] = dataRows(gInfra, HEADER_ROW.infra)
    .filter(({ row, index }) => {
      if (str(row[1]) != null) return true;
      noteAnomaly({
        dept: displayName,
        entity: "infrastructure",
        field: "labClassroomName",
        value: `sheet row ${index}`,
        note: "row carries data but no lab/classroom name; not imported",
      });
      return false;
    })
    .map(({ row }, i) => ({
      id: `${deptId}-i${i + 1}`,
      deptId,
      sNo: int(row[0]) ?? i + 1,
      labClassroomName: str(row[1]),
      floorRoomNo: str(row[2]),
      hoursAllottedPerWeek: num(row[3]),
      currentWeeklyWorkingHours: weeklyHours,
      labRoomInCharge: str(row[4]),
      labAssistantSupportStaff: str(row[5]),
      studentCapacity: int(row[6]),
      majorEquipmentAvailable: str(row[7]),
      programmesUsingFacility: str(row[8]),
      utilisationPct: num(row[9]) == null ? null : Math.round((num(row[9]) as number) * 10) / 10,
      digitalSmartBoard: bool(row[10], ctx("infrastructure", "digitalSmartBoard")),
      projector: bool(row[11], ctx("infrastructure", "projector")),
    }));

  /* ------------------------------------------------------------ HoD Submission
   * The snapshot block is read by label, not by fixed row, because its position
   * shifts with the length of the instructions above it. */
  const snap = (label: string) => int(pairValue(gHod, label));
  const hodSubmission: HodSubmission = {
    deptId,
    mobileContact: contact,
    dateOfSubmission: submissionDate,
    snapshot: {
      noOfProgrammes: snap("No. of Programmes"),
      totalFacultyReported: snap("Total Faculty Reported"),
      totalSanctionedIntake2026: snap("Total Sanctioned Student Intake (2026)"),
      facultyWithPhd: snap("Faculty with PhD"),
      totalStudentsAdmitted2026: snap("Total Students Admitted (2026)"),
      labsClassroomsReported: snap("Labs/Classrooms Reported"),
      programmesWithNepAlignment: snap("Programmes with NEP Alignment"),
      digitalSmartBoardAvailable: snap("Digital Smart Board Available"),
      projectorAvailable: snap("Projector Available"),
    },
    certificationSignedBy: clean(pairValue(gHod, "Signed by")),
    certificationDate: date(pairValue(gHod, "Date")),
    // Reported when the sheet carries a submission date; otherwise the workbook
    // was filled in but never formally submitted.
    status: submissionDate ? "Submitted" : rowHasData(gHod[5]) ? "Partial" : "Pending",
  };

  /* ------------------------------------------------------------ Faculty Targets
   * Row 5 holds the department summary as label/value pairs across the row. */
  const summaryAt = (labelCol: number, valueCol: number, label: string): number | null => {
    const got = clean(at(gTargets, 5, labelCol));
    if (got && got.toLowerCase().startsWith(label.toLowerCase().slice(0, 12))) {
      return num(at(gTargets, 5, valueCol));
    }
    return num(at(gTargets, 5, valueCol));
  };

  const targetSummary: DeptFacultyTargetSummary = {
    deptId,
    reviewPeriod,
    totalFacultyPlanned: summaryAt(0, 1, "Total Faculty Planned"),
    journalPublicationTarget: summaryAt(3, 4, "Journal Publication Target"),
    conferencePaperTarget: summaryAt(6, 7, "Conference Paper Target"),
    sponsoredIndustryProposalsTarget: summaryAt(9, 10, "Sponsored/Industry Proposals"),
    targetFundingLakh: summaryAt(12, 13, "Target Funding"),
    patentFilingTarget: summaryAt(15, 16, "Patent Filing Target"),
    avgMilestoneAchievement: summaryAt(18, 19, "Avg. Milestone Achievement"),
  };

  /** Targets join to faculty by name; unmatched rows still import, unlinked. */
  const byName = new Map(faculty.map((f) => [f.name.toLowerCase().replace(/\s+/g, " ").trim(), f.id]));
  const targets: FacultyTarget[] = dataRows(gTargets, HEADER_ROW.targets)
    .filter(({ row }) => str(row[1]) != null)
    .map(({ row }, i) => {
      const nm = (str(row[1]) as string).toLowerCase().replace(/\s+/g, " ").trim();
      const facultyId = byName.get(nm);
      if (!facultyId) {
        noteAnomaly({
          dept: displayName,
          entity: "facultyTarget",
          field: "facultyId",
          value: str(row[1]) as string,
          note: "target row has no matching faculty member; imported unlinked",
        });
      }
      return {
        id: `${deptId}-t${i + 1}`,
        facultyId: facultyId ?? `${deptId}-unmatched-${i + 1}`,
        sNo: int(row[0]) ?? i + 1,
        designation: normaliseDesignation(str(row[2])),
        natureOfAppointment: normaliseAppointment(str(row[3])),
        dateOfJoining: date(row[4]),
        reviewPeriod,
        sciSciESsciJournalPapers: int(row[5]),
        scopusUgcCareJournalPapers: int(row[6]),
        q1q2JournalPapersSubset: int(row[7]),
        internationalConferencePapers: int(row[8]),
        nationalConferencePapers: int(row[9]),
        govtSponsoredProjectProposals: int(row[10]),
        industryProjectProposals: int(row[11]),
        targetFundingLakh: num(row[12]),
        fundingAgenciesTargeted: str(row[13]),
        tentativeProjectThemeTitle: str(row[14]),
        targetSubmissionMonth: str(row[15]),
        consultancyIndustryAssignmentProposals: int(row[16]),
        patentsToBeFiled: int(row[17]),
        patentsExpectedPublished: int(row[18]),
        patentsExpectedGranted: int(row[19]),
        prototypeProductTechnologyProposed: str(row[20]),
        newRevisedCourseSyllabusOrLab: str(row[21]),
        eContentMoocInnovativeTeaching: str(row[22]),
        studentMentoringHackathonInternshipPlacement: str(row[23]),
        contributionToDeptDevelopment: str(row[24]),
        contributionToUniversityDevelopment: str(row[25]),
        expectedMeasurableOutcomeByJune2027: str(row[26]),
        q1Plan: str(row[27]),
        q2Plan: str(row[28]),
        q3Plan: str(row[29]),
        q4Plan: str(row[30]),
        q1Status: str(row[31]),
        q2Status: str(row[32]),
        q3Status: str(row[33]),
        q4Status: str(row[34]),
        milestoneAchievementPct: num(row[35]),
        hodPriority: str(row[36]),
        hodRemarksSupportRequired: str(row[37]),
        yearEndAchievementSummary: str(row[38]),
      };
    });

  const report: DeptReport = {
    deptId,
    department: displayName,
    sourceFile: file,
    nameFromFilename,
    counts: {
      programs: programs.length,
      faculty: faculty.length,
      facultyResearch: research.length,
      facultyProjects: projects.length,
      infrastructure: infrastructure.length,
      facultyTargets: targets.length,
    },
    missingEntities,
    entities: {
      department: countBlanks("department", [department as unknown as Record<string, unknown>]),
      program: countBlanks("program", programs as unknown as Record<string, unknown>[]),
      faculty: countBlanks("faculty", faculty as unknown as Record<string, unknown>[]),
      facultyResearch: countBlanks("facultyResearch", research as unknown as Record<string, unknown>[]),
      facultyProject: countBlanks("facultyProject", projects as unknown as Record<string, unknown>[]),
      infrastructure: countBlanks("infrastructure", infrastructure as unknown as Record<string, unknown>[]),
      hodSubmission: countBlanks("hodSubmission", [hodSubmission as unknown as Record<string, unknown>]),
      facultyTargetSummary: countBlanks("facultyTargetSummary", [
        targetSummary as unknown as Record<string, unknown>,
      ]),
      facultyTarget: countBlanks("facultyTarget", targets as unknown as Record<string, unknown>[]),
    },
  };

  return {
    department,
    programs,
    faculty,
    research,
    projects,
    infrastructure,
    hodSubmission,
    targetSummary,
    targets,
    report,
  };
}

/** "Assistant professor" -> "Assistant Professor"; leaves unknown text intact. */
function normaliseDesignation(v: string | null): string | null {
  if (v == null) return null;
  const canonical = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"];
  const hit = canonical.find((c) => c.toLowerCase() === v.toLowerCase());
  return hit ?? v;
}

/** "Guest Faculty" in the appointment column means the Guest appointment type. */
function normaliseAppointment(v: string | null): string | null {
  if (v == null) return null;
  const l = v.toLowerCase();
  if (l === "guest faculty") return "Guest";
  const canonical = ["Regular", "Contractual", "Self-Financing", "Guest"];
  const hit = canonical.find((c) => c.toLowerCase() === l);
  return hit ?? v;
}

/* -------------------------------------------------------------------- main */

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`No source directory at ${SRC_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SUPABASE_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"))
    .filter((f) => !f.includes(MASTER_MARKER))
    .sort();

  console.log(`Reading ${files.length} workbooks from excel-data/\n`);

  const all = {
    departments: [] as Department[],
    programs: [] as Program[],
    faculty: [] as Faculty[],
    facultyResearch: [] as FacultyResearch[],
    facultyProjects: [] as FacultyProject[],
    infrastructure: [] as Infrastructure[],
    hodSubmissions: [] as HodSubmission[],
    facultyTargetSummaries: [] as DeptFacultyTargetSummary[],
    facultyTargets: [] as FacultyTarget[],
  };
  const reports: DeptReport[] = [];
  const seenIds = new Map<string, string>();

  for (const file of files) {
    const p = parseWorkbook(file);

    // Ids must be unique even when two units run a department of the same name.
    let id = p.department.id;
    if (seenIds.has(id)) {
      let n = 2;
      while (seenIds.has(`${id}-${n}`)) n++;
      const unique = `${id}-${n}`;
      console.log(`  ! id collision "${id}" (${seenIds.get(id)}) -> "${unique}"`);
      retargetDept(p, unique);
      id = unique;
    }
    seenIds.set(id, file);

    all.departments.push(p.department);
    all.programs.push(...p.programs);
    all.faculty.push(...p.faculty);
    all.facultyResearch.push(...p.research);
    all.facultyProjects.push(...p.projects);
    all.infrastructure.push(...p.infrastructure);
    all.hodSubmissions.push(p.hodSubmission);
    all.facultyTargetSummaries.push(p.targetSummary);
    all.facultyTargets.push(...p.targets);
    reports.push(p.report);

    console.log(
      `  ${p.department.name.slice(0, 40).padEnd(42)} ` +
        `prog ${String(p.programs.length).padStart(2)}  ` +
        `fac ${String(p.faculty.length).padStart(3)}  ` +
        `proj ${String(p.projects.length).padStart(2)}  ` +
        `infra ${String(p.infrastructure.length).padStart(3)}  ` +
        `tgt ${String(p.targets.length).padStart(3)}` +
        (p.report.nameFromFilename ? "   [name from filename]" : "")
    );
  }

  // Short names label columns and sidebar entries, so two departments sharing
  // one (Electrical vs Electronics Engineering both initialise to "EE") would
  // be indistinguishable at a glance. Later duplicates take a numeric suffix.
  const shortSeen = new Map<string, number>();
  for (const d of all.departments) {
    const n = shortSeen.get(d.shortName) ?? 0;
    shortSeen.set(d.shortName, n + 1);
    if (n > 0) d.shortName = `${d.shortName}${n + 1}`;
  }

  writeJson("departments.json", all.departments);
  writeJson("programs.json", all.programs);
  writeJson("faculty.json", all.faculty);
  writeJson("facultyResearch.json", all.facultyResearch);
  writeJson("facultyProjects.json", all.facultyProjects);
  writeJson("infrastructure.json", all.infrastructure);
  writeJson("hodSubmissions.json", all.hodSubmissions);
  writeJson("facultyTargetSummaries.json", all.facultyTargetSummaries);
  writeJson("facultyTargets.json", all.facultyTargets);

  const totals = Object.fromEntries(
    Object.entries(all).map(([k, v]) => [k, (v as unknown[]).length])
  );

  writeJson("completeness-report.json", {
    generatedAt: new Date().toISOString(),
    sourceDir: "excel-data",
    workbooks: files.length,
    totals,
    /** Cells whose text could not be mapped onto the field's type. */
    anomalies,
    departments: reports,
  });

  writeSupabase(all);

  console.log("\nTotals:", JSON.stringify(totals));
  console.log(`Anomalies recorded: ${anomalies.length}`);
  console.log(`\nWrote ${Object.keys(all).length + 1} files to data/imported/`);
  console.log("Wrote supabase/schema.sql and supabase/seed.sql");
}

/** Rewrites every generated id in a parsed workbook onto a new department id. */
function retargetDept(p: Parsed, newId: string) {
  const old = p.department.id;
  const swap = (s: string) => s.replace(new RegExp("^" + old + "(?=-)"), newId);
  p.department.id = newId;
  for (const x of p.programs) {
    x.id = swap(x.id);
    x.deptId = newId;
  }
  const idMap = new Map<string, string>();
  for (const f of p.faculty) {
    const next = swap(f.id);
    idMap.set(f.id, next);
    f.id = next;
    f.departments = [newId];
    f.primaryDepartment = newId;
  }
  for (const r of p.research) {
    r.id = swap(r.id);
    r.facultyId = idMap.get(r.facultyId) ?? r.facultyId;
  }
  for (const pr of p.projects) {
    pr.id = swap(pr.id);
    pr.facultyId = idMap.get(pr.facultyId) ?? pr.facultyId;
  }
  for (const i of p.infrastructure) {
    i.id = swap(i.id);
    i.deptId = newId;
  }
  for (const t of p.targets) {
    t.id = swap(t.id);
    t.facultyId = idMap.get(t.facultyId) ?? swap(t.facultyId);
  }
  p.hodSubmission.deptId = newId;
  p.targetSummary.deptId = newId;
  p.report.deptId = newId;
}

/* ---------------------------------------------------------------- Supabase */

const sqlStr = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return "'" + String(v).replace(/'/g, "''") + "'";
};

function insertRows(table: string, cols: string[], rows: unknown[][]): string {
  if (!rows.length) return `-- ${table}: no rows\n`;
  const head = `INSERT INTO ${table} (${cols.join(", ")}) VALUES\n`;
  const body = rows.map((r) => "  (" + r.map(sqlStr).join(", ") + ")").join(",\n");
  return head + body + ";\n\n";
}

function writeSupabase(all: {
  departments: Department[];
  programs: Program[];
  faculty: Faculty[];
  facultyResearch: FacultyResearch[];
  facultyProjects: FacultyProject[];
  infrastructure: Infrastructure[];
  hodSubmissions: HodSubmission[];
  facultyTargetSummaries: DeptFacultyTargetSummary[];
  facultyTargets: FacultyTarget[];
}) {
  fs.writeFileSync(path.join(SUPABASE_DIR, "schema.sql"), SCHEMA_SQL, "utf8");

  let out = `-- Seed data for the VBSPU department dashboard.
-- Generated by scripts/import-excel-data.ts from the workbooks in excel-data/.
-- Regenerate with: npm run import:excel   (do not edit by hand)
--
-- Every NULL below is a cell the department left blank. They are deliberate:
-- a blank and a real 0 are different facts, so nothing is defaulted here.

BEGIN;

-- Idempotent: clear in FK-safe order before re-seeding.
TRUNCATE faculty_targets, faculty_target_summaries, hod_submissions, infrastructure,
         faculty_projects, faculty_research, faculty, programs, departments RESTART IDENTITY CASCADE;

`;

  out += insertRows(
    "departments",
    [
      "id",
      "faculty_of_engineering",
      "name",
      "short_name",
      "dean_name",
      "hod_name",
      "hod_contact",
      "reporting_period",
      "date_of_submission",
      "name_from_filename",
    ],
    all.departments.map((d) => [
      d.id,
      d.facultyOfEngineering,
      d.name,
      d.shortName,
      d.deanName,
      d.hodName,
      d.hodContact,
      d.reportingPeriod,
      d.dateOfSubmission,
      d.nameFromFilename ?? false,
    ])
  );

  out += insertRows(
    "programs",
    [
      "id",
      "dept_id",
      "s_no",
      "name",
      "year_of_commencement",
      "mode_of_programme",
      "sanctioned_professor",
      "sanctioned_associate_professor",
      "sanctioned_assistant_professor",
      "semester_fee_2024",
      "semester_fee_2025",
      "semester_fee_2026",
      "sanctioned_intake_2024",
      "sanctioned_intake_2025",
      "sanctioned_intake_2026",
      "admitted_2024",
      "admitted_2025",
      "admitted_2026",
      "nep_aligned",
      "multiple_entry_exit",
      "internship_end_of_year",
      "minor_specialisation_available",
      "remarks",
    ],
    all.programs.map((p) => [
      p.id,
      p.deptId,
      p.sNo,
      p.name,
      p.yearOfCommencement,
      p.modeOfProgramme,
      p.sanctionedFacultyPositions.professor,
      p.sanctionedFacultyPositions.associateProfessor,
      p.sanctionedFacultyPositions.assistantProfessor,
      p.semesterFeeByYear.y2024,
      p.semesterFeeByYear.y2025,
      p.semesterFeeByYear.y2026,
      p.sanctionedIntakeByYear.y2024,
      p.sanctionedIntakeByYear.y2025,
      p.sanctionedIntakeByYear.y2026,
      p.admittedByYear.y2024,
      p.admittedByYear.y2025,
      p.admittedByYear.y2026,
      p.nepAligned,
      p.multipleEntryExit,
      p.internshipEndOfYear,
      p.minorSpecialisationAvailable,
      p.remarks,
    ])
  );

  out += insertRows(
    "faculty",
    [
      "id",
      "dept_id",
      "s_no",
      "name",
      "designation",
      "appointment_type",
      "date_of_joining",
      "has_phd",
      "programmes_appointed_for",
      "teaching_load_hrs_per_week",
      "additional_responsibility",
    ],
    all.faculty.map((f) => [
      f.id,
      f.primaryDepartment,
      f.sNo,
      f.name,
      f.designation,
      f.appointmentType,
      f.dateOfJoining,
      f.hasPhd,
      f.programmesAppointedFor,
      f.teachingLoadHrsPerWeek,
      f.additionalResponsibility,
    ])
  );

  out += insertRows(
    "faculty_departments",
    ["faculty_id", "dept_id"],
    all.faculty.flatMap((f) => f.departments.map((d) => [f.id, d]))
  );

  out += insertRows(
    "faculty_research",
    [
      "id",
      "faculty_id",
      "journal_sci_scie_ssci",
      "journal_scopus_ugc_care",
      "journal_other",
      "conference_international",
      "conference_national",
      "h_index",
      "i10_index",
      "google_scholar_orcid_link",
      "patents_filed",
      "patents_published",
      "patents_granted",
      "phd_registered",
      "phd_awarded",
    ],
    all.facultyResearch.map((r) => [
      r.id,
      r.facultyId,
      r.journalPublications.sciScieSsci,
      r.journalPublications.scopusUgcCare,
      r.journalPublications.other,
      r.conferencePublications.international,
      r.conferencePublications.national,
      r.hIndex,
      r.i10Index,
      r.googleScholarOrcidLink,
      r.patents.filed,
      r.patents.published,
      r.patents.granted,
      r.phdSupervision.registered,
      r.phdSupervision.awarded,
    ])
  );

  out += insertRows(
    "faculty_projects",
    [
      "id",
      "faculty_id",
      "sponsoring_agency",
      "year_of_grant",
      "duration",
      "sanctioned_amount",
      "amount_released",
      "current_status",
    ],
    all.facultyProjects.map((p) => [
      p.id,
      p.facultyId,
      p.sponsoringAgency,
      p.yearOfGrant,
      p.duration,
      p.sanctionedAmount,
      p.amountReleased,
      p.currentStatus,
    ])
  );

  out += insertRows(
    "infrastructure",
    [
      "id",
      "dept_id",
      "s_no",
      "lab_classroom_name",
      "floor_room_no",
      "hours_allotted_per_week",
      "current_weekly_working_hours",
      "lab_room_in_charge",
      "lab_assistant_support_staff",
      "student_capacity",
      "major_equipment_available",
      "programmes_using_facility",
      "utilisation_pct",
      "digital_smart_board",
      "projector",
    ],
    all.infrastructure.map((i) => [
      i.id,
      i.deptId,
      i.sNo,
      i.labClassroomName,
      i.floorRoomNo,
      i.hoursAllottedPerWeek,
      i.currentWeeklyWorkingHours,
      i.labRoomInCharge,
      i.labAssistantSupportStaff,
      i.studentCapacity,
      i.majorEquipmentAvailable,
      i.programmesUsingFacility,
      i.utilisationPct,
      i.digitalSmartBoard,
      i.projector,
    ])
  );

  out += insertRows(
    "hod_submissions",
    [
      "dept_id",
      "mobile_contact",
      "date_of_submission",
      "snapshot_no_of_programmes",
      "snapshot_total_faculty_reported",
      "snapshot_total_sanctioned_intake_2026",
      "snapshot_faculty_with_phd",
      "snapshot_total_students_admitted_2026",
      "snapshot_labs_classrooms_reported",
      "snapshot_programmes_with_nep_alignment",
      "snapshot_digital_smart_board_available",
      "snapshot_projector_available",
      "certification_signed_by",
      "certification_date",
      "status",
    ],
    all.hodSubmissions.map((h) => [
      h.deptId,
      h.mobileContact,
      h.dateOfSubmission,
      h.snapshot.noOfProgrammes,
      h.snapshot.totalFacultyReported,
      h.snapshot.totalSanctionedIntake2026,
      h.snapshot.facultyWithPhd,
      h.snapshot.totalStudentsAdmitted2026,
      h.snapshot.labsClassroomsReported,
      h.snapshot.programmesWithNepAlignment,
      h.snapshot.digitalSmartBoardAvailable,
      h.snapshot.projectorAvailable,
      h.certificationSignedBy,
      h.certificationDate,
      h.status,
    ])
  );

  out += insertRows(
    "faculty_target_summaries",
    [
      "dept_id",
      "review_period",
      "total_faculty_planned",
      "journal_publication_target",
      "conference_paper_target",
      "sponsored_industry_proposals_target",
      "target_funding_lakh",
      "patent_filing_target",
      "avg_milestone_achievement",
    ],
    all.facultyTargetSummaries.map((s) => [
      s.deptId,
      s.reviewPeriod,
      s.totalFacultyPlanned,
      s.journalPublicationTarget,
      s.conferencePaperTarget,
      s.sponsoredIndustryProposalsTarget,
      s.targetFundingLakh,
      s.patentFilingTarget,
      s.avgMilestoneAchievement,
    ])
  );

  const targetCols = [
    "id",
    "faculty_id",
    "s_no",
    "designation",
    "nature_of_appointment",
    "date_of_joining",
    "review_period",
    "sci_scie_ssci_journal_papers",
    "scopus_ugc_care_journal_papers",
    "q1q2_journal_papers_subset",
    "international_conference_papers",
    "national_conference_papers",
    "govt_sponsored_project_proposals",
    "industry_project_proposals",
    "target_funding_lakh",
    "funding_agencies_targeted",
    "tentative_project_theme_title",
    "target_submission_month",
    "consultancy_industry_assignment_proposals",
    "patents_to_be_filed",
    "patents_expected_published",
    "patents_expected_granted",
    "prototype_product_technology_proposed",
    "new_revised_course_syllabus_or_lab",
    "e_content_mooc_innovative_teaching",
    "student_mentoring_hackathon_internship_placement",
    "contribution_to_dept_development",
    "contribution_to_university_development",
    "expected_measurable_outcome_by_june_2027",
    "q1_plan",
    "q2_plan",
    "q3_plan",
    "q4_plan",
    "q1_status",
    "q2_status",
    "q3_status",
    "q4_status",
    "milestone_achievement_pct",
    "hod_priority",
    "hod_remarks_support_required",
    "year_end_achievement_summary",
  ];
  // Only targets that resolved to a real faculty member can satisfy the FK.
  const facultyIds = new Set(all.faculty.map((f) => f.id));
  const linkedTargets = all.facultyTargets.filter((t) => facultyIds.has(t.facultyId));
  const orphanCount = all.facultyTargets.length - linkedTargets.length;
  if (orphanCount) {
    out += `-- ${orphanCount} target row(s) named a faculty member absent from the Faculty Details sheet\n`;
    out += `-- and are omitted here so the faculty_id foreign key holds. See completeness-report.json.\n`;
  }
  out += insertRows(
    "faculty_targets",
    targetCols,
    linkedTargets.map((t) => [
      t.id,
      t.facultyId,
      t.sNo,
      t.designation,
      t.natureOfAppointment,
      t.dateOfJoining,
      t.reviewPeriod,
      t.sciSciESsciJournalPapers,
      t.scopusUgcCareJournalPapers,
      t.q1q2JournalPapersSubset,
      t.internationalConferencePapers,
      t.nationalConferencePapers,
      t.govtSponsoredProjectProposals,
      t.industryProjectProposals,
      t.targetFundingLakh,
      t.fundingAgenciesTargeted,
      t.tentativeProjectThemeTitle,
      t.targetSubmissionMonth,
      t.consultancyIndustryAssignmentProposals,
      t.patentsToBeFiled,
      t.patentsExpectedPublished,
      t.patentsExpectedGranted,
      t.prototypeProductTechnologyProposed,
      t.newRevisedCourseSyllabusOrLab,
      t.eContentMoocInnovativeTeaching,
      t.studentMentoringHackathonInternshipPlacement,
      t.contributionToDeptDevelopment,
      t.contributionToUniversityDevelopment,
      t.expectedMeasurableOutcomeByJune2027,
      t.q1Plan,
      t.q2Plan,
      t.q3Plan,
      t.q4Plan,
      t.q1Status,
      t.q2Status,
      t.q3Status,
      t.q4Status,
      t.milestoneAchievementPct,
      t.hodPriority,
      t.hodRemarksSupportRequired,
      t.yearEndAchievementSummary,
    ])
  );

  out += "COMMIT;\n";
  fs.writeFileSync(path.join(SUPABASE_DIR, "seed.sql"), out, "utf8");
}

const SCHEMA_SQL = `-- Postgres schema for the VBSPU department dashboard.
-- Generated by scripts/import-excel-data.ts — regenerate with: npm run import:excel
--
-- GROUNDWORK ONLY: nothing in the app connects to Supabase yet. This mirrors
-- the TypeScript model in data/types.ts 1:1 so the current data/imported JSON
-- can be loaded without reshaping when that phase starts.
--
-- Nullability follows the source: every column fed by a spreadsheet cell is
-- nullable, because any of them can be blank in the workbooks. Only generated
-- identity columns and the names records are keyed by are NOT NULL. A blank
-- cell and a real 0 are different facts, so no column carries a DEFAULT that
-- would turn one into the other.

-- Ids are the slugs the importer derives from the source (e.g. 'cse-and-it',
-- 'cse-and-it-f3'), so they stay stable and human-readable across re-imports.

CREATE TABLE IF NOT EXISTS departments (
  id                      text PRIMARY KEY,
  faculty_of_engineering  text,
  name                    text NOT NULL,
  short_name              text NOT NULL,
  dean_name               text,
  hod_name                text,
  hod_contact             text,
  reporting_period        text,
  date_of_submission      text,
  -- True when the workbook named no department and the name came from its filename.
  name_from_filename      boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS programs (
  id                              text PRIMARY KEY,
  dept_id                         text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  s_no                            integer NOT NULL,
  name                            text NOT NULL,
  year_of_commencement            integer,
  -- Free text: some workbooks put a programme name in this column.
  mode_of_programme               text,
  sanctioned_professor            integer,
  sanctioned_associate_professor  integer,
  sanctioned_assistant_professor  integer,
  semester_fee_2024               numeric,
  semester_fee_2025               numeric,
  semester_fee_2026               numeric,
  sanctioned_intake_2024          integer,
  sanctioned_intake_2025          integer,
  sanctioned_intake_2026          integer,
  admitted_2024                   integer,
  admitted_2025                   integer,
  admitted_2026                   integer,
  nep_aligned                     boolean,
  multiple_entry_exit             boolean,
  internship_end_of_year          boolean,
  minor_specialisation_available  boolean,
  remarks                         text
);
CREATE INDEX IF NOT EXISTS programs_dept_id_idx ON programs(dept_id);

CREATE TABLE IF NOT EXISTS faculty (
  id                          text PRIMARY KEY,
  dept_id                     text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  s_no                        integer NOT NULL,
  name                        text NOT NULL,
  designation                 text,
  appointment_type            text,
  -- ISO yyyy-mm-dd where the cell parsed as a date, else the original text,
  -- so an unparseable date is preserved rather than dropped.
  date_of_joining             text,
  -- Null where the cell said something other than Yes/No (e.g. "Persuing").
  has_phd                     boolean,
  programmes_appointed_for    text,
  teaching_load_hrs_per_week  numeric,
  additional_responsibility   text
);
CREATE INDEX IF NOT EXISTS faculty_dept_id_idx ON faculty(dept_id);

-- One research record per faculty member (1—1).
CREATE TABLE IF NOT EXISTS faculty_research (
  id                         text PRIMARY KEY,
  faculty_id                 text NOT NULL UNIQUE REFERENCES faculty(id) ON DELETE CASCADE,
  journal_sci_scie_ssci      integer,
  journal_scopus_ugc_care    integer,
  journal_other              integer,
  conference_international   integer,
  conference_national        integer,
  h_index                    integer,
  i10_index                  integer,
  google_scholar_orcid_link  text,
  patents_filed              integer,
  patents_published          integer,
  patents_granted            integer,
  phd_registered             integer,
  phd_awarded                integer
);

-- Many projects per faculty member (1—many).
CREATE TABLE IF NOT EXISTS faculty_projects (
  id                 text PRIMARY KEY,
  faculty_id         text NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  sponsoring_agency  text,
  year_of_grant      integer,
  -- Free text: "3 Year", "Upto March 2028", "Co-PI with …" all occur.
  duration           text,
  -- Rupees. Null where the cell held something unquantifiable ("Beam Time").
  sanctioned_amount  numeric,
  amount_released    numeric,
  current_status     text
);
CREATE INDEX IF NOT EXISTS faculty_projects_faculty_id_idx ON faculty_projects(faculty_id);

CREATE TABLE IF NOT EXISTS infrastructure (
  id                            text PRIMARY KEY,
  dept_id                       text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  s_no                          integer NOT NULL,
  lab_classroom_name            text,
  floor_room_no                 text,
  hours_allotted_per_week       numeric,
  -- Department-level figure from the sheet header, repeated on each row.
  current_weekly_working_hours  numeric,
  lab_room_in_charge            text,
  lab_assistant_support_staff   text,
  student_capacity              integer,
  major_equipment_available     text,
  programmes_using_facility     text,
  utilisation_pct               numeric,
  digital_smart_board           boolean,
  projector                     boolean
);
CREATE INDEX IF NOT EXISTS infrastructure_dept_id_idx ON infrastructure(dept_id);

-- One submission record per department (1—1).
CREATE TABLE IF NOT EXISTS hod_submissions (
  dept_id                                 text PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  mobile_contact                          text,
  date_of_submission                      text,
  -- Snapshot figures as reported on the sheet, not recomputed from the rows.
  snapshot_no_of_programmes               integer,
  snapshot_total_faculty_reported         integer,
  snapshot_total_sanctioned_intake_2026   integer,
  snapshot_faculty_with_phd               integer,
  snapshot_total_students_admitted_2026   integer,
  snapshot_labs_classrooms_reported       integer,
  snapshot_programmes_with_nep_alignment  integer,
  snapshot_digital_smart_board_available  integer,
  snapshot_projector_available            integer,
  certification_signed_by                 text,
  certification_date                      text,
  status                                  text NOT NULL
    CHECK (status IN ('Submitted', 'Pending', 'Partial'))
);

-- One department-level target summary per department (1—1).
CREATE TABLE IF NOT EXISTS faculty_target_summaries (
  dept_id                              text PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  review_period                        text,
  total_faculty_planned                integer,
  journal_publication_target           integer,
  conference_paper_target              integer,
  sponsored_industry_proposals_target  integer,
  target_funding_lakh                  numeric,
  patent_filing_target                 integer,
  avg_milestone_achievement            numeric
);

-- One annual target sheet per faculty member (1—1).
CREATE TABLE IF NOT EXISTS faculty_targets (
  id                                                text PRIMARY KEY,
  faculty_id                                        text NOT NULL UNIQUE REFERENCES faculty(id) ON DELETE CASCADE,
  s_no                                              integer NOT NULL,
  designation                                       text,
  nature_of_appointment                             text,
  date_of_joining                                   text,
  review_period                                     text,
  sci_scie_ssci_journal_papers                      integer,
  scopus_ugc_care_journal_papers                    integer,
  q1q2_journal_papers_subset                        integer,
  international_conference_papers                   integer,
  national_conference_papers                        integer,
  govt_sponsored_project_proposals                  integer,
  industry_project_proposals                        integer,
  target_funding_lakh                               numeric,
  funding_agencies_targeted                         text,
  tentative_project_theme_title                     text,
  target_submission_month                           text,
  consultancy_industry_assignment_proposals         integer,
  patents_to_be_filed                               integer,
  patents_expected_published                        integer,
  patents_expected_granted                          integer,
  prototype_product_technology_proposed             text,
  new_revised_course_syllabus_or_lab                text,
  e_content_mooc_innovative_teaching                text,
  student_mentoring_hackathon_internship_placement  text,
  contribution_to_dept_development                  text,
  contribution_to_university_development            text,
  expected_measurable_outcome_by_june_2027          text,
  q1_plan                                           text,
  q2_plan                                           text,
  q3_plan                                           text,
  q4_plan                                           text,
  -- Free text, not an enum: the workbooks hold "--", "Achive" and whole
  -- sentences in these cells alongside the expected statuses.
  q1_status                                         text,
  q2_status                                         text,
  q3_status                                         text,
  q4_status                                         text,
  milestone_achievement_pct                         numeric,
  hod_priority                                      text,
  hod_remarks_support_required                      text,
  year_end_achievement_summary                      text
);
CREATE INDEX IF NOT EXISTS faculty_targets_faculty_id_idx ON faculty_targets(faculty_id);
`;

main();
