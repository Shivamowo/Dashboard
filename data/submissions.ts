import type { DeptFacultyTargetSummary, HodSubmission } from "./types";
import { departments, departmentById } from "./departments";
import { programsByDept } from "./programs";
import { facultyByDept, targetOf } from "./faculty";
import { infrastructureByDept } from "./infrastructure";
import { globalSingleton } from "./globalStore";

const submissionMeta: Record<
  string,
  { status: HodSubmission["status"]; certificationDate: string }
> = {
  cse: { status: "Submitted", certificationDate: "2026-07-18" },
  it: { status: "Submitted", certificationDate: "2026-07-22" },
  ece: { status: "Partial", certificationDate: "2026-08-02" },
  me: { status: "Pending", certificationDate: "-" },
};

type SubmissionOverride = Partial<
  Pick<HodSubmission, "mobileContact" | "certificationSignedBy" | "certificationDate" | "status">
>;

/** Mutable fields edited by the HoD (or Admin) go here, applied on top of the seed above. */
const overrides: Record<string, SubmissionOverride> = globalSingleton("hodSubmissionOverrides", () => ({}));

/** Applied on approval of a HoD edit, or immediately for Admin. */
export function updateHodSubmission(deptId: string, patch: SubmissionOverride) {
  overrides[deptId] = { ...overrides[deptId], ...patch };
}

/**
 * Snapshot values are recomputed from the underlying rows rather than stored,
 * per the aggregation rules in SYSTEM_DESIGN.md section 4 — this also means an
 * approved edit or onboarding is reflected immediately, with nothing to re-seed.
 */
export function hodSubmissionOf(deptId: string): HodSubmission | undefined {
  const d = departmentById(deptId);
  if (!d) return undefined;
  const progs = programsByDept(d.id);
  const facs = facultyByDept(d.id);
  const infra = infrastructureByDept(d.id);
  const meta = submissionMeta[d.id] ?? { status: "Pending" as const, certificationDate: "-" };
  const o = overrides[deptId];
  return {
    deptId: d.id,
    mobileContact: o?.mobileContact ?? d.hodContact,
    dateOfSubmission: d.dateOfSubmission,
    snapshot: {
      noOfProgrammes: progs.length,
      totalFacultyReported: facs.length,
      totalSanctionedIntake2026: progs.reduce((a, p) => a + p.sanctionedIntakeByYear.y2026, 0),
      facultyWithPhd: facs.filter((f) => f.hasPhd).length,
      totalStudentsAdmitted2026: progs.reduce((a, p) => a + p.admittedByYear.y2026, 0),
      labsClassroomsReported: infra.length,
      programmesWithNepAlignment: progs.filter((p) => p.nepAligned).length,
      digitalSmartBoardAvailable: infra.filter((x) => x.digitalSmartBoard).length,
      projectorAvailable: infra.filter((x) => x.projector).length,
    },
    certificationSignedBy: o?.certificationSignedBy ?? d.hodName,
    certificationDate: o?.certificationDate ?? meta.certificationDate,
    status: o?.status ?? meta.status,
  };
}

export const hodSubmissions = (): HodSubmission[] =>
  departments.map((d) => hodSubmissionOf(d.id)!);

export function deptTargetSummaryOf(deptId: string): DeptFacultyTargetSummary | undefined {
  const d = departmentById(deptId);
  if (!d) return undefined;
  const facs = facultyByDept(d.id);
  const tgts = facs.map((f) => targetOf(f.id)).filter(Boolean) as NonNullable<
    ReturnType<typeof targetOf>
  >[];
  return {
    deptId: d.id,
    reviewPeriod: "July 2026 - June 2027",
    totalFacultyPlanned: tgts.length,
    journalPublicationTarget: tgts.reduce(
      (a, t) => a + t.sciSciESsciJournalPapers + t.scopusUgcCareJournalPapers,
      0
    ),
    conferencePaperTarget: tgts.reduce(
      (a, t) => a + t.internationalConferencePapers + t.nationalConferencePapers,
      0
    ),
    sponsoredIndustryProposalsTarget: tgts.reduce(
      (a, t) => a + t.govtSponsoredProjectProposals + t.industryProjectProposals,
      0
    ),
    targetFundingLakh: tgts.reduce((a, t) => a + t.targetFundingLakh, 0),
    patentFilingTarget: tgts.reduce((a, t) => a + t.patentsToBeFiled, 0),
    avgMilestoneAchievement: tgts.length
      ? Math.round(
          (tgts.reduce((a, t) => a + t.milestoneAchievementPct, 0) / tgts.length) * 10
        ) / 10
      : 0,
  };
}

export const deptTargetSummaries = (): DeptFacultyTargetSummary[] =>
  departments.map((d) => deptTargetSummaryOf(d.id)!);
