import type { DeptFacultyTargetSummary, HodSubmission } from "./types";
import { departments } from "./departments";
import { programsByDept } from "./programs";
import { facultyByDept, targetOf } from "./faculty";
import { infrastructureByDept } from "./infrastructure";

const submissionMeta: Record<
  string,
  { status: HodSubmission["status"]; certificationDate: string }
> = {
  cse: { status: "Submitted", certificationDate: "2026-07-18" },
  it: { status: "Submitted", certificationDate: "2026-07-22" },
  ece: { status: "Partial", certificationDate: "2026-08-02" },
  me: { status: "Pending", certificationDate: "-" },
};

/**
 * Snapshot values are recomputed from the underlying rows rather than stored,
 * per the aggregation rules in SYSTEM_DESIGN.md section 4.
 */
export const hodSubmissions: HodSubmission[] = departments.map((d) => {
  const progs = programsByDept(d.id);
  const facs = facultyByDept(d.id);
  const infra = infrastructureByDept(d.id);
  const meta = submissionMeta[d.id];
  return {
    deptId: d.id,
    mobileContact: d.hodContact,
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
    certificationSignedBy: d.hodName,
    certificationDate: meta.certificationDate,
    status: meta.status,
  };
});

export const hodSubmissionOf = (deptId: string) =>
  hodSubmissions.find((s) => s.deptId === deptId);

export const deptTargetSummaries: DeptFacultyTargetSummary[] = departments.map((d) => {
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
});

export const deptTargetSummaryOf = (deptId: string) =>
  deptTargetSummaries.find((s) => s.deptId === deptId);
