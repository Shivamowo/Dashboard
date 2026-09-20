/**
 * Post-processes data/imported/*.json after `import:excel`:
 *
 *  1. SPLIT   — workbooks that bundle several departments (CSE & IT, Business
 *               Economics + Management, Electronics + ECE, Biotech/Micro/Biochem/
 *               Env. Studies) become one department per real department.
 *  2. DEDUPE  — a person listed in more than one department becomes ONE Faculty
 *               record with `departments: string[]` and a `primaryDepartment`.
 *               Key = employeeId when present, else normalised name
 *               (strip Dr./Prof./Mr./Ms./Mrs., collapse whitespace, lowercase).
 *
 * Idempotent: split sources vanish after the first run and merged faculty carry
 * `departments` already. Every name collision is logged to
 * data/imported/dedupe-log.json and printed.
 *
 *   npm run import:excel   (runs this automatically afterwards)
 */
import * as fs from "node:fs";
import * as path from "node:path";

const DIR = path.resolve(process.cwd(), "data", "imported");
const rd = (n: string) => JSON.parse(fs.readFileSync(path.join(DIR, n + ".json"), "utf8"));
const wr = (n: string, v: unknown) =>
  fs.writeFileSync(path.join(DIR, n + ".json"), JSON.stringify(v, null, 2) + "\n");

type Row = Record<string, any>;
const departments: Row[] = rd("departments");
const programs: Row[] = rd("programs");
const faculty: Row[] = rd("faculty");
const research: Row[] = rd("facultyResearch");
const projects: Row[] = rd("facultyProjects");
const targets: Row[] = rd("facultyTargets");
const infra: Row[] = rd("infrastructure");
const hod: Row[] = rd("hodSubmissions");
const summaries: Row[] = rd("facultyTargetSummaries");
const report: Row = rd("completeness-report");

interface Target {
  id: string;
  name: string;
  shortName: string;
  /** Regex on the row's label; the first target with no `test` is the default. */
  test?: RegExp;
}
interface Split {
  from: string;
  targets: Target[];
  programLabel: (p: Row) => string;
  facultyLabel: (f: Row) => string;
  infraLabel: (i: Row) => string;
}

const SPLITS: Split[] = [
  {
    from: "cse-and-it",
    targets: [
      { id: "cse", name: "Computer Science & Engineering", shortName: "CSE" },
      { id: "it", name: "Information Technology", shortName: "IT", test: /\bIT\b/ },
    ],
    programLabel: (p) => p.name,
    facultyLabel: (f) => f.programmesAppointedFor ?? "",
    infraLabel: (i) => `${i.labClassroomName ?? ""} ${i.programmesUsingFacility ?? ""}`.replace(/CSE/g, "CS-E"),
  },
  {
    from: "department-of-business-economics-and-department",
    targets: [
      { id: "business-economics", name: "Business Economics", shortName: "BE", test: /\(BE\)|business economics|b\.?\s?com/i },
      { id: "business-management", name: "Business Management", shortName: "BM" },
    ],
    programLabel: (p) => p.name,
    facultyLabel: (f) => f.programmesAppointedFor ?? "",
    infraLabel: (i) => `${i.labClassroomName ?? ""} ${i.programmesUsingFacility ?? ""}`,
  },
  {
    from: "department-of-electronics-engineering",
    targets: [
      { id: "electronics-engineering", name: "Electronics Engineering", shortName: "ELE" },
      { id: "electronics-and-communication-engineering", name: "Electronics & Communication Engineering", shortName: "ECE", test: /comm?unication|\bECE\b(?!.*\bEL\b)/i },
    ],
    programLabel: (p) => p.name,
    facultyLabel: (f) => f.programmesAppointedFor ?? "",
    infraLabel: (i) => `${i.labClassroomName ?? ""} ${i.programmesUsingFacility ?? ""}`,
  },
  {
    from: "biotechnology-microbiology-biochemistry",
    targets: [
      { id: "biotechnology", name: "Biotechnology", shortName: "BT" },
      { id: "microbiology", name: "Microbiology", shortName: "MB", test: /^$/ },
      { id: "biochemistry", name: "Biochemistry", shortName: "BC", test: /^$/ },
      { id: "environmental-studies", name: "Environmental Studies", shortName: "ENV", test: /^$/ },
    ],
    programLabel: (p) => p.name,
    facultyLabel: (f) => f.programmesAppointedFor ?? "",
    infraLabel: (i) => `${i.labClassroomName ?? ""}`,
  },
];

/** People whose additionalResponsibility names another department they head. */
const EXTRA_DEPTS: { test: RegExp; add: string[] }[] = [
  { test: /Head\s+Department\s+of\s+CSE\s+and\s+IT/i, add: ["cse", "it"] },
];

const pick = (s: Split, label: string) => {
  const hit = s.targets.find((t) => t.test && t.test.test(label));
  return (hit ?? s.targets.find((t) => !t.test) ?? s.targets[0]).id;
};

/* ------------------------------------------------------------------ split */
let splitCount = 0;
for (const s of SPLITS) {
  const src = departments.find((d) => d.id === s.from);
  if (!src) continue;
  splitCount++;
  const at = departments.indexOf(src);
  departments.splice(
    at,
    1,
    ...s.targets.map((t) => ({ ...src, id: t.id, name: t.name, shortName: t.shortName, nameFromFilename: false }))
  );
  for (const p of programs) if (p.deptId === s.from) p.deptId = pick(s, s.programLabel(p));
  for (const f of faculty) if (f.deptId === s.from) f.deptId = pick(s, s.facultyLabel(f));
  for (const i of infra) if (i.deptId === s.from) i.deptId = pick(s, s.infraLabel(i));

  const h = hod.find((x) => x.deptId === s.from);
  if (h) {
    hod.splice(
      hod.indexOf(h),
      1,
      ...s.targets.map((t) => ({
        ...h,
        deptId: t.id,
        // Snapshot figures were reported for the combined department, so they
        // cannot be attributed to one half — leave them unreported.
        snapshot: Object.fromEntries(Object.keys(h.snapshot).map((k) => [k, null])),
      }))
    );
  }
  const ts = summaries.find((x) => x.deptId === s.from);
  if (ts) {
    summaries.splice(
      summaries.indexOf(ts),
      1,
      ...s.targets.map((t) => ({
        ...Object.fromEntries(Object.entries(ts).map(([k, v]) => [k, k === "reviewPeriod" ? v : null])),
        deptId: t.id,
      }))
    );
  }
}

/* ----------------------------------------------------------------- dedupe */
const normName = (n: string) =>
  n
    .toLowerCase()
    .replace(/\b(dr|prof|professor|mr|ms|mrs|miss)\b\.?/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const keyOf = (f: Row) => (f.employeeId ? "id:" + String(f.employeeId).trim().toLowerCase() : "nm:" + normName(f.name));

for (const f of faculty) {
  if (!f.departments) f.departments = [f.deptId];
  delete f.deptId;
  for (const x of EXTRA_DEPTS)
    if (f.additionalResponsibility && x.test.test(f.additionalResponsibility))
      for (const d of x.add) if (!f.departments.includes(d)) f.departments.push(d);
}

const collisions: Row[] = [];
const canon = new Map<string, Row>();
const redirect = new Map<string, string>();
const kept: Row[] = [];
for (const f of faculty) {
  const k = keyOf(f);
  const c = canon.get(k);
  if (!c) {
    canon.set(k, f);
    kept.push(f);
    continue;
  }
  for (const d of f.departments) if (!c.departments.includes(d)) c.departments.push(d);
  for (const [key, v] of Object.entries(f)) if (c[key] == null && v != null) c[key] = v;
  redirect.set(f.id, c.id);
  collisions.push({ key: k, kept: c.id, merged: f.id, name: f.name, departments: c.departments });
}
for (const f of kept) f.primaryDepartment = f.primaryDepartment ?? f.departments[0];

const dropIds = new Set<string>();
const dedupeBy = (rows: Row[], get: (r: Row) => string) => {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const fid = get(r);
    const to = redirect.get(fid) ?? fid;
    if (redirect.has(fid)) r.facultyId = to;
    if (!redirect.has(fid)) {
      seen.add(to);
      return true;
    }
    if (seen.has(to) || rows.some((o) => o !== r && !redirect.has(get(o)) && get(o) === to)) {
      dropIds.add(r.id);
      return false; // canonical already has this record
    }
    seen.add(to);
    return true;
  });
};
const research2 = dedupeBy(research, (r) => r.facultyId);
const targets2 = dedupeBy(targets, (r) => r.facultyId);
for (const p of projects) if (redirect.has(p.facultyId)) p.facultyId = redirect.get(p.facultyId);

/* Sequence numbers within each department, in file order. */
const seq = new Map<string, number>();
for (const f of kept) f.sNo = (seq.set(f.primaryDepartment, (seq.get(f.primaryDepartment) ?? 0) + 1), seq.get(f.primaryDepartment));

wr("departments", departments);
wr("programs", programs);
wr("faculty", kept);
wr("facultyResearch", research2);
wr("facultyProjects", projects);
wr("facultyTargets", targets2);
wr("infrastructure", infra);
wr("hodSubmissions", hod);
wr("facultyTargetSummaries", summaries);
wr("dedupe-log", { generatedAt: new Date().toISOString(), rule: "employeeId, else normalised name", collisions });

report.totals = {
  ...report.totals,
  departments: departments.length,
  faculty: kept.length,
  facultyResearch: research2.length,
  facultyTargets: targets2.length,
  hodSubmissions: hod.length,
  facultyTargetSummaries: summaries.length,
};
report.note = "Combined workbooks split into individual departments; faculty deduped (see dedupe-log.json).";
wr("completeness-report", report);

console.log(`Split ${splitCount} combined workbook(s) → ${departments.length} departments`);
console.log(`Faculty: ${kept.length} distinct; ${collisions.length} collision(s) merged`);
for (const c of collisions) console.log("  collision:", c.name, "→", c.kept, c.departments.join(", "));
console.log(`Multi-department faculty: ${kept.filter((f) => f.departments.length > 1).length}`);
