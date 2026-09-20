import {
  addNullable,
  departments,
  faculty,
  facultyByDept,
  researchOf,
  targetOf,
  type Faculty,
} from "@/data";

/**
 * Flattened rows for the roster and target tables.
 *
 * Every figure stays nullable end to end. An unreported h-index must not sort
 * or total as a zero, and the cell must render "Not provided" rather than a
 * number the department never gave — so nothing here fills a gap with a
 * fallback. Totals use addNullable, which returns null only when every part
 * was blank.
 */

export interface FacultyRosterRow {
  id: string;
  /** Every department served — filters match ANY of these. */
  deptIds: string[];
  primaryDeptId: string;
  /** All department names, joined for display. */
  deptName: string;
  sNo: number;
  name: string;
  qualification: string | null;
  designation: string | null;
  appointmentType: string | null;
  dateOfJoining: string | null;
  hasPhd: boolean | null;
  programmesAppointedFor: string | null;
  teachingLoadHrsPerWeek: number | null;
  additionalResponsibility: string | null;
  journalTotal: number | null;
  sci: number | null;
  scopus: number | null;
  otherJournal: number | null;
  conferenceTotal: number | null;
  intlConference: number | null;
  nationalConference: number | null;
  hIndex: number | null;
  i10Index: number | null;
  patentsFiled: number | null;
  phdRegistered: number | null;
  phdAwarded: number | null;
  milestonePct: number | null;
  hodPriority: string | null;
}

const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id;

/** "Dept A · Dept B" for a faculty member serving several departments. */
export const deptNamesOf = (f: Pick<Faculty, "departments">) => f.departments.map(deptName).join(" · ");

export function toRosterRow(f: Faculty): FacultyRosterRow {
  const r = researchOf(f.id);
  const t = targetOf(f.id);
  return {
    id: f.id,
    deptIds: f.departments,
    primaryDeptId: f.primaryDepartment,
    deptName: deptNamesOf(f),
    sNo: f.sNo,
    name: f.name,
    qualification: f.qualification ?? null,
    designation: f.designation,
    appointmentType: f.appointmentType,
    dateOfJoining: f.dateOfJoining,
    hasPhd: f.hasPhd,
    programmesAppointedFor: f.programmesAppointedFor,
    teachingLoadHrsPerWeek: f.teachingLoadHrsPerWeek,
    additionalResponsibility: f.additionalResponsibility,
    journalTotal: r
      ? addNullable(
          r.journalPublications.sciScieSsci,
          r.journalPublications.scopusUgcCare,
          r.journalPublications.other
        )
      : null,
    sci: r?.journalPublications.sciScieSsci ?? null,
    scopus: r?.journalPublications.scopusUgcCare ?? null,
    otherJournal: r?.journalPublications.other ?? null,
    conferenceTotal: r
      ? addNullable(r.conferencePublications.international, r.conferencePublications.national)
      : null,
    intlConference: r?.conferencePublications.international ?? null,
    nationalConference: r?.conferencePublications.national ?? null,
    hIndex: r?.hIndex ?? null,
    i10Index: r?.i10Index ?? null,
    patentsFiled: r?.patents.filed ?? null,
    phdRegistered: r?.phdSupervision.registered ?? null,
    phdAwarded: r?.phdSupervision.awarded ?? null,
    milestonePct: t?.milestoneAchievementPct ?? null,
    hodPriority: t?.hodPriority ?? null,
  };
}

export const rosterRows = (deptId?: string): FacultyRosterRow[] =>
  (deptId ? facultyByDept(deptId) : faculty).map(toRosterRow);

export interface TargetTrackerRow {
  id: string;
  facultyId: string;
  name: string;
  designation: string | null;
  natureOfAppointment: string | null;
  journalTarget: number | null;
  conferenceTarget: number | null;
  proposalTarget: number | null;
  fundingTargetLakh: number | null;
  patentTarget: number | null;
  q1Status: string | null;
  q2Status: string | null;
  q3Status: string | null;
  q4Status: string | null;
  milestonePct: number | null;
  hodPriority: string | null;
  hodRemarks: string | null;
  targetSubmissionMonth: string | null;
  theme: string | null;
}

export function targetTrackerRows(deptId: string): TargetTrackerRow[] {
  return facultyByDept(deptId)
    .map((f) => {
      const t = targetOf(f.id);
      if (!t) return null;
      return {
        id: t.id,
        facultyId: f.id,
        name: f.name,
        designation: t.designation,
        natureOfAppointment: t.natureOfAppointment,
        journalTarget: addNullable(t.sciSciESsciJournalPapers, t.scopusUgcCareJournalPapers),
        conferenceTarget: addNullable(t.internationalConferencePapers, t.nationalConferencePapers),
        proposalTarget: addNullable(t.govtSponsoredProjectProposals, t.industryProjectProposals),
        fundingTargetLakh: t.targetFundingLakh,
        patentTarget: t.patentsToBeFiled,
        q1Status: t.q1Status,
        q2Status: t.q2Status,
        q3Status: t.q3Status,
        q4Status: t.q4Status,
        milestonePct: t.milestoneAchievementPct,
        hodPriority: t.hodPriority,
        hodRemarks: t.hodRemarksSupportRequired,
        targetSubmissionMonth: t.targetSubmissionMonth,
        theme: t.tentativeProjectThemeTitle,
      } satisfies TargetTrackerRow;
    })
    .filter(Boolean) as TargetTrackerRow[];
}

export const deptNameMap = (): Record<string, string> =>
  Object.fromEntries(departments.map((d) => [d.id, d.name]));
