"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveChangeRequest,
  createChangeRequest,
  facultyById,
  infrastructureById,
  rejectChangeRequest,
  setFacultyProjects,
  setFacultyResearch,
  setFacultyTarget,
  targetOf,
  updateDepartmentHod,
  updateFacultyRecord,
  updateHodSubmission,
  updateInfrastructureRecord,
  type FacultyProfileEdit,
  type FacultyProjectEdit,
  type FacultyResearchEdit,
  type FacultyTargetEdit,
  type Role,
} from "@/data";
import { getSessionUser } from "./session";

async function requireUser(roles: Role[]) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) throw new Error("Not authorized for this action.");
  return user;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;
const bool = (f: FormData, k: string) => f.get(k) === "on";

/* ---------------------------------------------------------- faculty profile */

function readFacultyProfile(form: FormData): FacultyProfileEdit {
  return {
    name: str(form, "name"),
    designation: str(form, "designation") as FacultyProfileEdit["designation"],
    appointmentType: str(form, "appointmentType") as FacultyProfileEdit["appointmentType"],
    dateOfJoining: str(form, "dateOfJoining"),
    hasPhd: bool(form, "hasPhd"),
    programmesAppointedFor: str(form, "programmesAppointedFor"),
    teachingLoadHrsPerWeek: num(form, "teachingLoadHrsPerWeek"),
    additionalResponsibility: str(form, "additionalResponsibility") || "NA",
  };
}

function readFacultyResearch(form: FormData): FacultyResearchEdit {
  return {
    journalPublications: {
      sciScieSsci: num(form, "sciScieSsci"),
      scopusUgcCare: num(form, "scopusUgcCare"),
      other: num(form, "otherJournal"),
    },
    conferencePublications: {
      international: num(form, "intlConference"),
      national: num(form, "nationalConference"),
    },
    hIndex: num(form, "hIndex"),
    i10Index: num(form, "i10Index"),
    googleScholarOrcidLink: str(form, "googleScholarOrcidLink"),
    patents: {
      filed: num(form, "patentsFiled"),
      published: num(form, "patentsPublished"),
      granted: num(form, "patentsGranted"),
    },
    phdSupervision: {
      registered: num(form, "phdRegistered"),
      awarded: num(form, "phdAwarded"),
    },
  };
}

function readFacultyTarget(form: FormData): FacultyTargetEdit {
  return {
    designation: str(form, "designation"),
    natureOfAppointment: str(form, "natureOfAppointment"),
    dateOfJoining: str(form, "dateOfJoining"),
    reviewPeriod: str(form, "reviewPeriod"),
    sciSciESsciJournalPapers: num(form, "sciSciESsciJournalPapers"),
    scopusUgcCareJournalPapers: num(form, "scopusUgcCareJournalPapers"),
    q1q2JournalPapersSubset: num(form, "q1q2JournalPapersSubset"),
    internationalConferencePapers: num(form, "internationalConferencePapers"),
    nationalConferencePapers: num(form, "nationalConferencePapers"),
    govtSponsoredProjectProposals: num(form, "govtSponsoredProjectProposals"),
    industryProjectProposals: num(form, "industryProjectProposals"),
    targetFundingLakh: num(form, "targetFundingLakh"),
    fundingAgenciesTargeted: str(form, "fundingAgenciesTargeted"),
    tentativeProjectThemeTitle: str(form, "tentativeProjectThemeTitle"),
    targetSubmissionMonth: str(form, "targetSubmissionMonth"),
    consultancyIndustryAssignmentProposals: num(form, "consultancyIndustryAssignmentProposals"),
    patentsToBeFiled: num(form, "patentsToBeFiled"),
    patentsExpectedPublished: num(form, "patentsExpectedPublished"),
    patentsExpectedGranted: num(form, "patentsExpectedGranted"),
    prototypeProductTechnologyProposed: str(form, "prototypeProductTechnologyProposed"),
    newRevisedCourseSyllabusOrLab: str(form, "newRevisedCourseSyllabusOrLab"),
    eContentMoocInnovativeTeaching: str(form, "eContentMoocInnovativeTeaching"),
    studentMentoringHackathonInternshipPlacement: str(form, "studentMentoringHackathonInternshipPlacement"),
    contributionToDeptDevelopment: str(form, "contributionToDeptDevelopment"),
    contributionToUniversityDevelopment: str(form, "contributionToUniversityDevelopment"),
    expectedMeasurableOutcomeByJune2027: str(form, "expectedMeasurableOutcomeByJune2027"),
    q1Plan: str(form, "q1Plan"),
    q2Plan: str(form, "q2Plan"),
    q3Plan: str(form, "q3Plan"),
    q4Plan: str(form, "q4Plan"),
    q1Status: str(form, "q1Status") as FacultyTargetEdit["q1Status"],
    q2Status: str(form, "q2Status") as FacultyTargetEdit["q2Status"],
    q3Status: str(form, "q3Status") as FacultyTargetEdit["q3Status"],
    q4Status: str(form, "q4Status") as FacultyTargetEdit["q4Status"],
    milestoneAchievementPct: num(form, "milestoneAchievementPct"),
    hodPriority: str(form, "hodPriority") as FacultyTargetEdit["hodPriority"],
    hodRemarksSupportRequired: str(form, "hodRemarksSupportRequired"),
    yearEndAchievementSummary: str(form, "yearEndAchievementSummary"),
  };
}

function readFacultyProjects(form: FormData): FacultyProjectEdit[] {
  const count = Number(form.get("projectCount") ?? 0);
  const list: FacultyProjectEdit[] = [];
  for (let i = 0; i < count; i++) {
    const agency = str(form, `project-${i}-sponsoringAgency`);
    if (!agency) continue;
    list.push({
      sponsoringAgency: agency,
      yearOfGrant: num(form, `project-${i}-yearOfGrant`),
      duration: str(form, `project-${i}-duration`),
      sanctionedAmount: num(form, `project-${i}-sanctionedAmount`),
      amountReleased: num(form, `project-${i}-amountReleased`),
      currentStatus: str(form, `project-${i}-currentStatus`) as FacultyProjectEdit["currentStatus"],
    });
  }
  return list;
}

function readInfra(form: FormData) {
  return {
    labClassroomName: str(form, "labClassroomName"),
    floorRoomNo: str(form, "floorRoomNo"),
    hoursAllottedPerWeek: num(form, "hoursAllottedPerWeek"),
    currentWeeklyWorkingHours: num(form, "currentWeeklyWorkingHours"),
    labRoomInCharge: str(form, "labRoomInCharge"),
    labAssistantSupportStaff: str(form, "labAssistantSupportStaff"),
    studentCapacity: num(form, "studentCapacity"),
    majorEquipmentAvailable: str(form, "majorEquipmentAvailable"),
    programmesUsingFacility: str(form, "programmesUsingFacility"),
    utilisationPct: num(form, "utilisationPct"),
    digitalSmartBoard: bool(form, "digitalSmartBoard"),
    projector: bool(form, "projector"),
  };
}

/* ------------------------------------------------------------ Faculty role */

export async function submitOwnFacultyProfile(form: FormData) {
  const user = await requireUser(["faculty"]);
  if (!user.facultyId) throw new Error("No faculty record yet.");
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: user.facultyId,
    submittedByUserId: user.id,
    submittedByRole: "faculty",
    deptId: user.deptId!,
    section: "profile",
    payload: readFacultyProfile(form),
  });
  revalidatePath("/faculty/edit");
  redirect("/faculty/edit?submitted=1");
}

export async function submitOwnFacultyResearch(form: FormData) {
  const user = await requireUser(["faculty"]);
  if (!user.facultyId) throw new Error("No faculty record yet.");
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: user.facultyId,
    submittedByUserId: user.id,
    submittedByRole: "faculty",
    deptId: user.deptId!,
    section: "research",
    payload: readFacultyResearch(form),
  });
  revalidatePath("/faculty/edit");
  redirect("/faculty/edit?submitted=1");
}

export async function submitOwnFacultyTarget(form: FormData) {
  const user = await requireUser(["faculty"]);
  if (!user.facultyId) throw new Error("No faculty record yet.");
  const existing = targetOf(user.facultyId);
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: user.facultyId,
    submittedByUserId: user.id,
    submittedByRole: "faculty",
    deptId: user.deptId!,
    section: "target",
    payload: { ...readFacultyTarget(form), sNo: existing?.sNo ?? facultyById(user.facultyId)?.sNo ?? 0 },
  });
  revalidatePath("/faculty/edit");
  redirect("/faculty/edit?submitted=1");
}

export async function submitOwnFacultyProjects(form: FormData) {
  const user = await requireUser(["faculty"]);
  if (!user.facultyId) throw new Error("No faculty record yet.");
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: user.facultyId,
    submittedByUserId: user.id,
    submittedByRole: "faculty",
    deptId: user.deptId!,
    section: "projects",
    payload: { projects: readFacultyProjects(form) },
  });
  revalidatePath("/faculty/edit");
  redirect("/faculty/edit?submitted=1");
}

/* ----------------------------------------------------------------- HoD role */

export async function submitHodOwnSubmission(form: FormData) {
  const user = await requireUser(["hod"]);
  createChangeRequest({
    type: "edit",
    targetEntity: "HoD",
    targetId: user.deptId!,
    submittedByUserId: user.id,
    submittedByRole: "hod",
    deptId: user.deptId!,
    payload: {
      mobileContact: str(form, "mobileContact"),
      certificationSignedBy: str(form, "certificationSignedBy"),
      certificationDate: str(form, "certificationDate"),
    },
  });
  revalidatePath("/hod/edit");
  redirect("/hod/edit?submitted=1");
}

function requireHodOwnsFaculty(user: { role: Role; deptId?: string }, facultyId: string) {
  const f = facultyById(facultyId);
  if (!f || f.deptId !== user.deptId) throw new Error("That faculty member is outside your department.");
  return f;
}

export async function submitHodFacultyProfile(facultyId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  requireHodOwnsFaculty(user, facultyId);
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: facultyId,
    submittedByUserId: user.id,
    submittedByRole: "hod",
    deptId: user.deptId!,
    section: "profile",
    payload: readFacultyProfile(form),
  });
  revalidatePath(`/hod/faculty/${facultyId}/edit`);
  redirect(`/hod/faculty/${facultyId}/edit?submitted=1`);
}

export async function submitHodFacultyResearch(facultyId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  requireHodOwnsFaculty(user, facultyId);
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: facultyId,
    submittedByUserId: user.id,
    submittedByRole: "hod",
    deptId: user.deptId!,
    section: "research",
    payload: readFacultyResearch(form),
  });
  revalidatePath(`/hod/faculty/${facultyId}/edit`);
  redirect(`/hod/faculty/${facultyId}/edit?submitted=1`);
}

export async function submitHodFacultyTarget(facultyId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  requireHodOwnsFaculty(user, facultyId);
  const existing = targetOf(facultyId);
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: facultyId,
    submittedByUserId: user.id,
    submittedByRole: "hod",
    deptId: user.deptId!,
    section: "target",
    payload: { ...readFacultyTarget(form), sNo: existing?.sNo ?? facultyById(facultyId)?.sNo ?? 0 },
  });
  revalidatePath(`/hod/faculty/${facultyId}/edit`);
  redirect(`/hod/faculty/${facultyId}/edit?submitted=1`);
}

export async function submitHodFacultyProjects(facultyId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  requireHodOwnsFaculty(user, facultyId);
  createChangeRequest({
    type: "edit",
    targetEntity: "Faculty",
    targetId: facultyId,
    submittedByUserId: user.id,
    submittedByRole: "hod",
    deptId: user.deptId!,
    section: "projects",
    payload: { projects: readFacultyProjects(form) },
  });
  revalidatePath(`/hod/faculty/${facultyId}/edit`);
  redirect(`/hod/faculty/${facultyId}/edit?submitted=1`);
}

/* ------------------------------------------------------------------ ET role */

export async function submitEtInfraEdit(infraId: string, form: FormData) {
  const user = await requireUser(["et"]);
  const infra = infrastructureById(infraId);
  if (!infra) throw new Error("Room not found.");
  createChangeRequest({
    type: "edit",
    targetEntity: "Infrastructure",
    targetId: infraId,
    submittedByUserId: user.id,
    submittedByRole: "et",
    deptId: infra.deptId,
    payload: readInfra(form),
  });
  revalidatePath(`/et/infra/${infraId}/edit`);
  redirect(`/et/infra/${infraId}/edit?submitted=1`);
}

/* --------------------------------------------------------------- Admin role */

export async function adminUpdateDept(deptId: string, form: FormData) {
  await requireUser(["admin"]);
  updateDepartmentHod(deptId, { hodContact: str(form, "mobileContact"), hodName: str(form, "certificationSignedBy") || undefined });
  updateHodSubmission(deptId, {
    mobileContact: str(form, "mobileContact"),
    certificationSignedBy: str(form, "certificationSignedBy"),
    certificationDate: str(form, "certificationDate"),
    status: str(form, "status") as "Submitted" | "Pending" | "Partial",
  });
  revalidatePath(`/admin/dept/${deptId}`);
  redirect(`/admin/dept/${deptId}`);
}

export async function adminUpdateFacultyProfile(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  updateFacultyRecord(facultyId, readFacultyProfile(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyResearch(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  setFacultyResearch(facultyId, readFacultyResearch(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyTarget(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  const existing = targetOf(facultyId);
  setFacultyTarget(facultyId, existing?.sNo ?? facultyById(facultyId)?.sNo ?? 0, readFacultyTarget(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyProjects(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  setFacultyProjects(facultyId, readFacultyProjects(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateInfra(infraId: string, form: FormData) {
  await requireUser(["admin"]);
  updateInfrastructureRecord(infraId, readInfra(form));
  revalidatePath("/admin/infrastructure");
  redirect("/admin/infrastructure");
}

export async function adminApprove(id: string, form: FormData) {
  const user = await requireUser(["admin"]);
  approveChangeRequest(id, user.id, str(form, "reviewNotes") || undefined);
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

export async function adminReject(id: string, form: FormData) {
  const user = await requireUser(["admin"]);
  const reason = str(form, "reviewNotes");
  if (!reason) throw new Error("A rejection reason is required.");
  rejectChangeRequest(id, user.id, reason);
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}
