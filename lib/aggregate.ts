import {
  departments,
  faculty,
  facultyByDept,
  facultyResearch,
  facultyTargets,
  infrastructure,
  infrastructureByDept,
  programs,
  programsByDept,
  researchOf,
  targetOf,
  type Department,
} from "@/data";

export interface DeptRollup {
  dept: Department;
  facultyCount: number;
  phdCount: number;
  phdPct: number;
  programCount: number;
  sanctionedIntake2026: number;
  admitted2026: number;
  fillRatePct: number;
  totalPublications: number;
  journalPublications: number;
  conferencePublications: number;
  patentsFiled: number;
  avgTeachingLoad: number;
  infraRooms: number;
  avgUtilisation: number;
  avgMilestonePct: number;
  atRiskFaculty: number;
  totalStudentCapacity: number;
}

const avg = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;

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

  const journal = res.reduce(
    (a, r) =>
      a + r.journalPublications.sciScieSsci + r.journalPublications.scopusUgcCare + r.journalPublications.other,
    0
  );
  const conference = res.reduce(
    (a, r) => a + r.conferencePublications.international + r.conferencePublications.national,
    0
  );
  const sanctioned = progs.reduce((a, p) => a + p.sanctionedIntakeByYear.y2026, 0);
  const admitted = progs.reduce((a, p) => a + p.admittedByYear.y2026, 0);
  const phd = facs.filter((f) => f.hasPhd).length;

  return {
    dept,
    facultyCount: facs.length,
    phdCount: phd,
    phdPct: facs.length ? Math.round((phd / facs.length) * 1000) / 10 : 0,
    programCount: progs.length,
    sanctionedIntake2026: sanctioned,
    admitted2026: admitted,
    fillRatePct: sanctioned ? Math.round((admitted / sanctioned) * 1000) / 10 : 0,
    totalPublications: journal + conference,
    journalPublications: journal,
    conferencePublications: conference,
    patentsFiled: res.reduce((a, r) => a + r.patents.filed, 0),
    avgTeachingLoad: avg(facs.map((f) => f.teachingLoadHrsPerWeek)),
    infraRooms: infra.length,
    avgUtilisation: avg(infra.map((x) => x.utilisationPct)),
    avgMilestonePct: avg(tgts.map((t) => t.milestoneAchievementPct)),
    atRiskFaculty: tgts.filter((t) => isAtRisk(t.milestoneAchievementPct)).length,
    totalStudentCapacity: infra.reduce((a, x) => a + x.studentCapacity, 0),
  };
}

export const deptRollups = (): DeptRollup[] => departments.map(rollupDept);

export interface UniversityRollup {
  deptCount: number;
  facultyCount: number;
  phdCount: number;
  phdPct: number;
  programCount: number;
  sanctionedIntake2026: number;
  admitted2026: number;
  fillRatePct: number;
  totalPublications: number;
  journalPublications: number;
  conferencePublications: number;
  patentsFiled: number;
  avgUtilisation: number;
  infraRooms: number;
  avgMilestonePct: number;
  atRiskFaculty: number;
}

export function rollupUniversity(): UniversityRollup {
  const journal = facultyResearch.reduce(
    (a, r) =>
      a + r.journalPublications.sciScieSsci + r.journalPublications.scopusUgcCare + r.journalPublications.other,
    0
  );
  const conference = facultyResearch.reduce(
    (a, r) => a + r.conferencePublications.international + r.conferencePublications.national,
    0
  );
  const sanctioned = programs.reduce((a, p) => a + p.sanctionedIntakeByYear.y2026, 0);
  const admitted = programs.reduce((a, p) => a + p.admittedByYear.y2026, 0);
  const phd = faculty.filter((f) => f.hasPhd).length;

  return {
    deptCount: departments.length,
    facultyCount: faculty.length,
    phdCount: phd,
    phdPct: faculty.length ? Math.round((phd / faculty.length) * 1000) / 10 : 0,
    programCount: programs.length,
    sanctionedIntake2026: sanctioned,
    admitted2026: admitted,
    fillRatePct: sanctioned ? Math.round((admitted / sanctioned) * 1000) / 10 : 0,
    totalPublications: journal + conference,
    journalPublications: journal,
    conferencePublications: conference,
    patentsFiled: facultyResearch.reduce((a, r) => a + r.patents.filed, 0),
    avgUtilisation: avg(infrastructure.map((x) => x.utilisationPct)),
    infraRooms: infrastructure.length,
    avgMilestonePct: avg(facultyTargets.map((t) => t.milestoneAchievementPct)),
    atRiskFaculty: facultyTargets.filter((t) => isAtRisk(t.milestoneAchievementPct)).length,
  };
}

/** A faculty target is flagged at-risk when milestone achievement falls below 50%. */
export const isAtRisk = (milestonePct: number) => milestonePct < 50;

export interface IntakeTrendPoint {
  [key: string]: string | number;
  year: string;
  sanctioned: number;
  admitted: number;
}

export function intakeTrend(deptId?: string): IntakeTrendPoint[] {
  const rows = deptId ? programsByDept(deptId) : programs;
  const keys = ["y2024", "y2025", "y2026"] as const;
  const labels = ["2024", "2025", "2026"];
  return keys.map((k, i) => ({
    year: labels[i],
    sanctioned: rows.reduce((a, p) => a + p.sanctionedIntakeByYear[k], 0),
    admitted: rows.reduce((a, p) => a + p.admittedByYear[k], 0),
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
      journal += row?.journal ?? 0;
      conference += row?.conference ?? 0;
    }
    return { year: String(y), journal, conference };
  });
}

export const formatInr = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));

export const yesNo = (b: boolean) => (b ? "Yes" : "No");
