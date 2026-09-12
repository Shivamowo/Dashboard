import {
  departments,
  faculty,
  facultyByDept,
  researchOf,
  targetOf,
  type Faculty,
  type QuarterStatus,
  type HodPriority,
} from "@/data";

export interface FacultyRosterRow {
  id: string;
  deptId: string;
  deptName: string;
  sNo: number;
  name: string;
  designation: string;
  appointmentType: string;
  dateOfJoining: string;
  hasPhd: boolean;
  programmesAppointedFor: string;
  teachingLoadHrsPerWeek: number;
  additionalResponsibility: string;
  journalTotal: number;
  sci: number;
  scopus: number;
  otherJournal: number;
  conferenceTotal: number;
  intlConference: number;
  nationalConference: number;
  hIndex: number;
  i10Index: number;
  patentsFiled: number;
  phdRegistered: number;
  phdAwarded: number;
  milestonePct: number;
  hodPriority: HodPriority | "—";
}

const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id;

export function toRosterRow(f: Faculty): FacultyRosterRow {
  const r = researchOf(f.id);
  const t = targetOf(f.id);
  return {
    id: f.id,
    deptId: f.deptId,
    deptName: deptName(f.deptId),
    sNo: f.sNo,
    name: f.name,
    designation: f.designation,
    appointmentType: f.appointmentType,
    dateOfJoining: f.dateOfJoining,
    hasPhd: f.hasPhd,
    programmesAppointedFor: f.programmesAppointedFor,
    teachingLoadHrsPerWeek: f.teachingLoadHrsPerWeek,
    additionalResponsibility: f.additionalResponsibility,
    journalTotal: r
      ? r.journalPublications.sciScieSsci + r.journalPublications.scopusUgcCare + r.journalPublications.other
      : 0,
    sci: r?.journalPublications.sciScieSsci ?? 0,
    scopus: r?.journalPublications.scopusUgcCare ?? 0,
    otherJournal: r?.journalPublications.other ?? 0,
    conferenceTotal: r
      ? r.conferencePublications.international + r.conferencePublications.national
      : 0,
    intlConference: r?.conferencePublications.international ?? 0,
    nationalConference: r?.conferencePublications.national ?? 0,
    hIndex: r?.hIndex ?? 0,
    i10Index: r?.i10Index ?? 0,
    patentsFiled: r?.patents.filed ?? 0,
    phdRegistered: r?.phdSupervision.registered ?? 0,
    phdAwarded: r?.phdSupervision.awarded ?? 0,
    milestonePct: t?.milestoneAchievementPct ?? 0,
    hodPriority: t?.hodPriority ?? "—",
  };
}

export const rosterRows = (deptId?: string): FacultyRosterRow[] =>
  (deptId ? facultyByDept(deptId) : faculty).map(toRosterRow);

export interface TargetTrackerRow {
  id: string;
  facultyId: string;
  name: string;
  designation: string;
  natureOfAppointment: string;
  journalTarget: number;
  conferenceTarget: number;
  proposalTarget: number;
  fundingTargetLakh: number;
  patentTarget: number;
  q1Status: QuarterStatus;
  q2Status: QuarterStatus;
  q3Status: QuarterStatus;
  q4Status: QuarterStatus;
  milestonePct: number;
  hodPriority: HodPriority;
  hodRemarks: string;
  targetSubmissionMonth: string;
  theme: string;
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
        journalTarget: t.sciSciESsciJournalPapers + t.scopusUgcCareJournalPapers,
        conferenceTarget: t.internationalConferencePapers + t.nationalConferencePapers,
        proposalTarget: t.govtSponsoredProjectProposals + t.industryProjectProposals,
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
