import {
  addNullable,
  avgOf,
  countTrue,
  departments,
  faculty,
  facultyByDept,
  facultyResearch,
  facultyTargets,
  infrastructure,
  infrastructureByDept,
  orZero,
  programs,
  programsByDept,
  pctOf,
  researchOf,
  sumOf,
  targetOf,
  type Department,
} from "@/data";

/**
 * Department and university rollups.
 *
 * Unreported figures are skipped, never counted as zero: an average utilisation
 * taken over rooms that never reported one would be dragged toward zero and
 * understate every department that left the column blank. Where nothing at all
 * was reported the rollup is null and the KPI renders "Not provided" rather
 * than a confident 0. Counts of rows the app holds (faculty, programmes, rooms)
 * are always exact and stay plain numbers.
 */

export interface DeptRollup {
  dept: Department;
  facultyCount: number;
  phdCount: number;
  phdPct: number | null;
  programCount: number;
  sanctionedIntake2026: number | null;
  admitted2026: number | null;
  fillRatePct: number | null;
  totalPublications: number | null;
  journalPublications: number | null;
  conferencePublications: number | null;
  patentsFiled: number | null;
  avgTeachingLoad: number | null;
  infraRooms: number;
  avgUtilisation: number | null;
  avgMilestonePct: number | null;
  atRiskFaculty: number;
  totalStudentCapacity: number | null;
}

export function rollupDept(dept: Department): DeptRollup {
  const facs = facultyByDept(dept.id);
  const progs = programsByDept(dept.id);
  const infra = infrastructureByDept(dept.id);
  const res = facs.map((f) => researchOf(f.id)).filter(Boolean) as NonNullable<
    ReturnType<typeof researchOf>
  >[];
  const tgts = facs.map((f) => targetOf(f.id)).filter(Boolean) as NonNullable<
    ReturnType<typeof targetOf>
  >[];

  const journal = sumOf(res, (r) =>
    addNullable(
      r.journalPublications.sciScieSsci,
      r.journalPublications.scopusUgcCare,
      r.journalPublications.other
    )
  );
  const conference = sumOf(res, (r) =>
    addNullable(r.conferencePublications.international, r.conferencePublications.national)
  );
  const sanctioned = sumOf(progs, (p) => p.sanctionedIntakeByYear.y2026);
  const admitted = sumOf(progs, (p) => p.admittedByYear.y2026);
  const phd = countTrue(facs, (f) => f.hasPhd);

  return {
    dept,
    facultyCount: facs.length,
    phdCount: phd,
    phdPct: facs.length ? pctOf(phd, facs.length) : null,
    programCount: progs.length,
    sanctionedIntake2026: sanctioned,
    admitted2026: admitted,
    fillRatePct: pctOf(admitted, sanctioned),
    totalPublications: addNullable(journal, conference),
    journalPublications: journal,
    conferencePublications: conference,
    patentsFiled: sumOf(res, (r) => r.patents.filed),
    avgTeachingLoad: avgOf(facs, (f) => f.teachingLoadHrsPerWeek),
    infraRooms: infra.length,
    avgUtilisation: avgOf(infra, (x) => x.utilisationPct),
    avgMilestonePct: avgOf(tgts, (t) => t.milestoneAchievementPct),
    atRiskFaculty: tgts.filter((t) => isAtRisk(t.milestoneAchievementPct)).length,
    totalStudentCapacity: sumOf(infra, (x) => x.studentCapacity),
  };
}

export const deptRollups = (): DeptRollup[] => departments.map(rollupDept);

export interface UniversityRollup {
  deptCount: number;
  facultyCount: number;
  phdCount: number;
  phdPct: number | null;
  programCount: number;
  sanctionedIntake2026: number | null;
  admitted2026: number | null;
  fillRatePct: number | null;
  totalPublications: number | null;
  journalPublications: number | null;
  conferencePublications: number | null;
  patentsFiled: number | null;
  avgUtilisation: number | null;
  infraRooms: number;
  avgMilestonePct: number | null;
  atRiskFaculty: number;
}

export function rollupUniversity(): UniversityRollup {
  const journal = sumOf(facultyResearch, (r) =>
    addNullable(
      r.journalPublications.sciScieSsci,
      r.journalPublications.scopusUgcCare,
      r.journalPublications.other
    )
  );
  const conference = sumOf(facultyResearch, (r) =>
    addNullable(r.conferencePublications.international, r.conferencePublications.national)
  );
  const sanctioned = sumOf(programs, (p) => p.sanctionedIntakeByYear.y2026);
  const admitted = sumOf(programs, (p) => p.admittedByYear.y2026);
  const phd = countTrue(faculty, (f) => f.hasPhd);

  return {
    deptCount: departments.length,
    facultyCount: faculty.length,
    phdCount: phd,
    phdPct: faculty.length ? pctOf(phd, faculty.length) : null,
    programCount: programs.length,
    sanctionedIntake2026: sanctioned,
    admitted2026: admitted,
    fillRatePct: pctOf(admitted, sanctioned),
    totalPublications: addNullable(journal, conference),
    journalPublications: journal,
    conferencePublications: conference,
    patentsFiled: sumOf(facultyResearch, (r) => r.patents.filed),
    avgUtilisation: avgOf(infrastructure, (x) => x.utilisationPct),
    infraRooms: infrastructure.length,
    avgMilestonePct: avgOf(facultyTargets, (t) => t.milestoneAchievementPct),
    atRiskFaculty: facultyTargets.filter((t) => isAtRisk(t.milestoneAchievementPct)).length,
  };
}

/**
 * A faculty target is flagged at-risk when milestone achievement falls below
 * 50%. A target that never reported one is not at risk — it is unknown, and
 * flagging it would accuse a department of underperforming on missing data.
 */
export const isAtRisk = (milestonePct: number | null | undefined) =>
  milestonePct != null && milestonePct < 50;

export interface IntakeTrendPoint {
  [key: string]: string | number;
  year: string;
  sanctioned: number;
  admitted: number;
}

/**
 * Recharts needs concrete numbers per point, so unreported years contribute 0
 * to the series. The chart's own empty state covers the case where no year has
 * any figure at all, so an all-blank department shows a message, not a flat line.
 */
export function intakeTrend(deptId?: string): IntakeTrendPoint[] {
  const rows = deptId ? programsByDept(deptId) : programs;
  const keys = ["y2024", "y2025", "y2026"] as const;
  const labels = ["2024", "2025", "2026"];
  return keys.map((k, i) => ({
    year: labels[i],
    sanctioned: orZero(sumOf(rows, (p) => p.sanctionedIntakeByYear[k])),
    admitted: orZero(sumOf(rows, (p) => p.admittedByYear[k])),
  }));
}

export function publicationTrend(facultyId: string) {
  const r = researchOf(facultyId);
  if (!r) return [];
  return r.yearly.map((y) => ({
    year: String(y.year),
    journal: y.journal,
    conference: y.conference,
  }));
}

export function deptPublicationTrend(deptId: string) {
  const facs = facultyByDept(deptId);
  const years = [2022, 2023, 2024, 2025, 2026];
  return years.map((y) => {
    let journal = 0;
    let conference = 0;
    for (const f of facs) {
      const r = researchOf(f.id);
      const row = r?.yearly.find((x) => x.year === y);
      journal += orZero(row?.journal);
      conference += orZero(row?.conference);
    }
    return { year: String(y), journal, conference };
  });
}

export const formatInr = (n: number | null | undefined): string | null =>
  n == null ? null : "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));

export const yesNo = (b: boolean | null | undefined): string | null =>
  b == null ? null : b ? "Yes" : "No";
