import type { DeptFacultyTargetSummary, HodSubmission } from "./types";
import { departments, departmentById } from "./departments";
import { programsByDept } from "./programs";
import { facultyByDept, targetOf } from "./faculty";
import { infrastructureByDept } from "./infrastructure";
import { globalSingleton } from "./globalStore";
import { imported, usingImportedData } from "./source";
import { addNullable, avgOf, countTrue, sumOf } from "./nullable";

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

const importedSubmission = (deptId: string) =>
  usingImportedData ? imported.hodSubmissions.find((h) => h.deptId === deptId) : undefined;

/**
 * Snapshot values are recomputed from the underlying rows rather than stored,
 * per the aggregation rules in SYSTEM_DESIGN.md section 4 — this also means an
 * approved edit or onboarding is reflected immediately, with nothing to re-seed.
 *
 * With imported data the department's own reported figure wins where it has
 * one, since that is what the HoD certified; the recomputed count fills in only
 * where the sheet's snapshot block was left blank. Counts of rows the app holds
 * (programmes, faculty, rooms) are always exact, so they need no such fallback.
 */
export function hodSubmissionOf(deptId: string): HodSubmission | undefined {
  const d = departmentById(deptId);
  if (!d) return undefined;
  const progs = programsByDept(d.id);
  const facs = facultyByDept(d.id);
  const infra = infrastructureByDept(d.id);
  const meta = submissionMeta[d.id] ?? { status: "Pending" as const, certificationDate: "-" };
  const o = overrides[deptId];
  const src = importedSubmission(deptId);

  /** Reported figure first, computed fallback second. */
  const reported = (
    value: number | null | undefined,
    computed: number | null
  ): number | null => (value == null ? computed : value);

  return {
    deptId: d.id,
    mobileContact: o?.mobileContact ?? src?.mobileContact ?? d.hodContact,
    dateOfSubmission: src?.dateOfSubmission ?? d.dateOfSubmission,
    snapshot: {
      noOfProgrammes: progs.length,
      totalFacultyReported: facs.length,
      totalSanctionedIntake2026: reported(
        src?.snapshot.totalSanctionedIntake2026,
        sumOf(progs, (p) => p.sanctionedIntakeByYear.y2026)
      ),
      facultyWithPhd: countTrue(facs, (f) => f.hasPhd),
      totalStudentsAdmitted2026: reported(
        src?.snapshot.totalStudentsAdmitted2026,
        sumOf(progs, (p) => p.admittedByYear.y2026)
      ),
      labsClassroomsReported: infra.length,
      programmesWithNepAlignment: countTrue(progs, (p) => p.nepAligned),
      digitalSmartBoardAvailable: countTrue(infra, (x) => x.digitalSmartBoard),
      projectorAvailable: countTrue(infra, (x) => x.projector),
    },
    certificationSignedBy: o?.certificationSignedBy ?? src?.certificationSignedBy ?? d.hodName,
    certificationDate: o?.certificationDate ?? src?.certificationDate ?? (src ? null : meta.certificationDate),
    status: o?.status ?? src?.status ?? meta.status,
  };
}

export const hodSubmissions = (): HodSubmission[] =>
  departments.map((d) => hodSubmissionOf(d.id)!);

/**
 * Department target summary. The workbooks carry their own summary row, which
 * is used where present; otherwise the figures are rolled up from the
 * individual faculty target rows, skipping unreported cells rather than
 * counting them as zero.
 */
export function deptTargetSummaryOf(deptId: string): DeptFacultyTargetSummary | undefined {
  const d = departmentById(deptId);
  if (!d) return undefined;
  const facs = facultyByDept(d.id);
  const tgts = facs.map((f) => targetOf(f.id)).filter(Boolean) as NonNullable<
    ReturnType<typeof targetOf>
  >[];

  const src = usingImportedData
    ? imported.facultyTargetSummaries.find((s) => s.deptId === deptId)
    : undefined;
  const reported = (value: number | null | undefined, computed: number | null) =>
    value == null ? computed : value;

  return {
    deptId: d.id,
    reviewPeriod: src?.reviewPeriod ?? "July 2026 - June 2027",
    totalFacultyPlanned: reported(src?.totalFacultyPlanned, tgts.length || null),
    journalPublicationTarget: reported(
      src?.journalPublicationTarget,
      sumOf(tgts, (t) => addNullable(t.sciSciESsciJournalPapers, t.scopusUgcCareJournalPapers))
    ),
    conferencePaperTarget: reported(
      src?.conferencePaperTarget,
      sumOf(tgts, (t) => addNullable(t.internationalConferencePapers, t.nationalConferencePapers))
    ),
    sponsoredIndustryProposalsTarget: reported(
      src?.sponsoredIndustryProposalsTarget,
      sumOf(tgts, (t) => addNullable(t.govtSponsoredProjectProposals, t.industryProjectProposals))
    ),
    targetFundingLakh: reported(
      src?.targetFundingLakh,
      sumOf(tgts, (t) => t.targetFundingLakh)
    ),
    patentFilingTarget: reported(
      src?.patentFilingTarget,
      sumOf(tgts, (t) => t.patentsToBeFiled)
    ),
    avgMilestoneAchievement: reported(
      src?.avgMilestoneAchievement,
      avgOf(tgts, (t) => t.milestoneAchievementPct)
    ),
  };
}

export const deptTargetSummaries = (): DeptFacultyTargetSummary[] =>
  departments.map((d) => deptTargetSummaryOf(d.id)!);
