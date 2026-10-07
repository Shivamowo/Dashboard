"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addFacultyRecord,
  addInfrastructureRecord,
  addProgramRecord,
  faculty as allFaculty,
  programById,
  updateDepartmentInfo,
  updateProgramRecord,
  type ProgramEdit,
  approveChangeRequest,
  createChangeRequest,
  facultyById,
  infrastructureById,
  rejectChangeRequest,
  setFacultyProjects,
  setFacultyResearch,
  setFacultyTarget,
  submitOnboarding,
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
import { HOD_EDITS_NEED_APPROVAL } from "./feature-flags";
import { createFacultyLogin } from "./data/faculty-accounts";
import { createFaculty, FacultyValidationError } from "./data/faculty";
import { normalizeName, type FacultyErrors, type FacultyInput } from "./data/faculty-schema";
import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";
import { ROLE_HOME } from "./demo-accounts";

async function requireUser(roles: Role[]) {
  const user = await getSessionUser();
  // A cookie whose account no longer exists is an ended session, not an
  // authorization failure — bounce to login rather than throwing at the user.
  // See requireSessionUser in ./session for why that happens.
  if (!user) redirect("/login?error=expired");
  if (!roles.includes(user.role)) throw new Error("Not authorized for this action.");
  return user;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const bool = (f: FormData, k: string) => f.get(k) === "on";
// Excel-migration helpers: a blank field is NULL ("Not provided"), never 0 or "".
const strN = (f: FormData, k: string): string | null => str(f, k) || null;
const numN = (f: FormData, k: string): number | null => {
  const v = str(f, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const triN = (f: FormData, k: string): boolean | null => {
  const v = str(f, k);
  return v === "Yes" ? true : v === "No" ? false : null;
};

/* ---------------------------------------------------------- faculty profile */

function readFacultyProfile(form: FormData): FacultyProfileEdit {
  return {
    name: str(form, "name"),
    designation: str(form, "designation") as FacultyProfileEdit["designation"],
    appointmentType: str(form, "appointmentType") as FacultyProfileEdit["appointmentType"],
    dateOfJoining: strN(form, "dateOfJoining"),
    hasPhd: bool(form, "hasPhd"),
    programmesAppointedFor: strN(form, "programmesAppointedFor"),
    teachingLoadHrsPerWeek: numN(form, "teachingLoadHrsPerWeek"),
    additionalResponsibility: strN(form, "additionalResponsibility"),
  };
}

function readFacultyResearch(form: FormData): FacultyResearchEdit {
  return {
    journalPublications: {
      sciScieSsci: numN(form, "sciScieSsci"),
      scopusUgcCare: numN(form, "scopusUgcCare"),
      other: numN(form, "otherJournal"),
    },
    conferencePublications: {
      international: numN(form, "intlConference"),
      national: numN(form, "nationalConference"),
    },
    hIndex: numN(form, "hIndex"),
    i10Index: numN(form, "i10Index"),
    googleScholarOrcidLink: strN(form, "googleScholarOrcidLink"),
    patents: {
      filed: numN(form, "patentsFiled"),
      published: numN(form, "patentsPublished"),
      granted: numN(form, "patentsGranted"),
    },
    phdSupervision: {
      registered: numN(form, "phdRegistered"),
      awarded: numN(form, "phdAwarded"),
    },
  };
}

function readFacultyTarget(form: FormData): FacultyTargetEdit {
  return {
    designation: strN(form, "designation"),
    natureOfAppointment: strN(form, "natureOfAppointment"),
    dateOfJoining: strN(form, "dateOfJoining"),
    reviewPeriod: strN(form, "reviewPeriod"),
    sciSciESsciJournalPapers: numN(form, "sciSciESsciJournalPapers"),
    scopusUgcCareJournalPapers: numN(form, "scopusUgcCareJournalPapers"),
    q1q2JournalPapersSubset: numN(form, "q1q2JournalPapersSubset"),
    internationalConferencePapers: numN(form, "internationalConferencePapers"),
    nationalConferencePapers: numN(form, "nationalConferencePapers"),
    govtSponsoredProjectProposals: numN(form, "govtSponsoredProjectProposals"),
    industryProjectProposals: numN(form, "industryProjectProposals"),
    targetFundingLakh: numN(form, "targetFundingLakh"),
    fundingAgenciesTargeted: strN(form, "fundingAgenciesTargeted"),
    tentativeProjectThemeTitle: strN(form, "tentativeProjectThemeTitle"),
    targetSubmissionMonth: strN(form, "targetSubmissionMonth"),
    consultancyIndustryAssignmentProposals: numN(form, "consultancyIndustryAssignmentProposals"),
    patentsToBeFiled: numN(form, "patentsToBeFiled"),
    patentsExpectedPublished: numN(form, "patentsExpectedPublished"),
    patentsExpectedGranted: numN(form, "patentsExpectedGranted"),
    prototypeProductTechnologyProposed: strN(form, "prototypeProductTechnologyProposed"),
    newRevisedCourseSyllabusOrLab: strN(form, "newRevisedCourseSyllabusOrLab"),
    eContentMoocInnovativeTeaching: strN(form, "eContentMoocInnovativeTeaching"),
    studentMentoringHackathonInternshipPlacement: strN(form, "studentMentoringHackathonInternshipPlacement"),
    contributionToDeptDevelopment: strN(form, "contributionToDeptDevelopment"),
    contributionToUniversityDevelopment: strN(form, "contributionToUniversityDevelopment"),
    expectedMeasurableOutcomeByJune2027: strN(form, "expectedMeasurableOutcomeByJune2027"),
    q1Plan: strN(form, "q1Plan"),
    q2Plan: strN(form, "q2Plan"),
    q3Plan: strN(form, "q3Plan"),
    q4Plan: strN(form, "q4Plan"),
    q1Status: str(form, "q1Status") as FacultyTargetEdit["q1Status"],
    q2Status: str(form, "q2Status") as FacultyTargetEdit["q2Status"],
    q3Status: str(form, "q3Status") as FacultyTargetEdit["q3Status"],
    q4Status: str(form, "q4Status") as FacultyTargetEdit["q4Status"],
    milestoneAchievementPct: numN(form, "milestoneAchievementPct"),
    hodPriority: str(form, "hodPriority") as FacultyTargetEdit["hodPriority"],
    hodRemarksSupportRequired: strN(form, "hodRemarksSupportRequired"),
    yearEndAchievementSummary: strN(form, "yearEndAchievementSummary"),
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
      yearOfGrant: numN(form, `project-${i}-yearOfGrant`),
      duration: strN(form, `project-${i}-duration`),
      sanctionedAmount: numN(form, `project-${i}-sanctionedAmount`),
      amountReleased: numN(form, `project-${i}-amountReleased`),
      currentStatus: str(form, `project-${i}-currentStatus`) as FacultyProjectEdit["currentStatus"],
    });
  }
  return list;
}

function readInfra(form: FormData) {
  return {
    labClassroomName: strN(form, "labClassroomName"),
    floorRoomNo: strN(form, "floorRoomNo"),
    hoursAllottedPerWeek: numN(form, "hoursAllottedPerWeek"),
    currentWeeklyWorkingHours: numN(form, "currentWeeklyWorkingHours"),
    labRoomInCharge: strN(form, "labRoomInCharge"),
    labAssistantSupportStaff: strN(form, "labAssistantSupportStaff"),
    studentCapacity: numN(form, "studentCapacity"),
    majorEquipmentAvailable: strN(form, "majorEquipmentAvailable"),
    programmesUsingFacility: strN(form, "programmesUsingFacility"),
    utilisationPct: numN(form, "utilisationPct"),
    digitalSmartBoard: bool(form, "digitalSmartBoard"),
    projector: bool(form, "projector"),
  };
}

/* ------------------------------------------------------------- Onboarding */

export async function submitFacultyOnboarding(form: FormData) {
  const user = await requireUser(["faculty"]);
  await submitOnboarding({
    userId: user.id,
    targetEntity: "Faculty",
    deptId: user.deptId!,
    payload: {
      profile: readFacultyProfile(form),
      research: readFacultyResearch(form),
      projects: readFacultyProjects(form),
    },
  });
  redirect("/faculty?submitted=1");
}

export async function submitHodOnboarding(form: FormData) {
  const user = await requireUser(["hod"]);
  await submitOnboarding({
    userId: user.id,
    targetEntity: "HoD",
    deptId: user.deptId!,
    payload: {
      name: str(form, "name"),
      mobileContact: str(form, "mobileContact"),
    },
  });
  redirect("/hod?submitted=1");
}

/* ------------------------------------------------------------ Faculty role */

export async function submitOwnFacultyProfile(form: FormData) {
  const user = await requireUser(["faculty"]);
  if (!user.facultyId) throw new Error("No faculty record yet.");
  await createChangeRequest({
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
  await createChangeRequest({
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
  await createChangeRequest({
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
  await createChangeRequest({
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
/**
 * HoD edits apply immediately while HOD_EDITS_NEED_APPROVAL is off (the current
 * setting — see lib/feature-flags.ts). Turn it on to route them back through the
 * Admin approval queue; the change-request branches below are kept intact.
 * A HoD may only touch their own department, its rooms and its faculty.
 */

export async function submitHodOwnSubmission(form: FormData) {
  const user = await requireUser(["hod"]);
  const patch = {
    mobileContact: strN(form, "mobileContact"),
    certificationSignedBy: strN(form, "certificationSignedBy"),
    certificationDate: strN(form, "certificationDate"),
  };
  if (HOD_EDITS_NEED_APPROVAL) {
    await createChangeRequest({
      type: "edit",
      targetEntity: "HoD",
      targetId: user.deptId!,
      submittedByUserId: user.id,
      submittedByRole: "hod",
      deptId: user.deptId!,
      payload: patch,
    });
  } else {
    // Department header block of the HoD workbook.
    await updateDepartmentInfo(user.deptId!, {
      facultyOfEngineering: strN(form, "facultyOfEngineering"),
      deanName: strN(form, "deanName"),
      hodName: strN(form, "hodName"),
      hodContact: patch.mobileContact,
      reportingPeriod: strN(form, "reportingPeriod"),
      dateOfSubmission: strN(form, "dateOfSubmission"),
    });
    const status = str(form, "status");
    await updateHodSubmission(user.deptId!, {
      ...patch,
      ...(status ? { status: status as "Submitted" | "Pending" | "Partial" } : {}),
    });
  }
  revalidatePath("/hod");
  revalidatePath("/hod/edit");
  redirect("/hod/edit?submitted=1");
}

function requireHodOwnsFaculty(user: { role: Role; deptId?: string }, facultyId: string) {
  const f = facultyById(facultyId);
  if (!f || !f.departments.includes(user.deptId ?? "")) throw new Error("That faculty member is outside your department.");
  return f;
}

type HodFacultySection = "profile" | "research" | "target" | "projects";

async function hodFacultyEdit(facultyId: string, section: HodFacultySection, payload: any) {
  const user = await requireUser(["hod"]);
  requireHodOwnsFaculty(user, facultyId);
  if (HOD_EDITS_NEED_APPROVAL) {
    await createChangeRequest({
      type: "edit",
      targetEntity: "Faculty",
      targetId: facultyId,
      submittedByUserId: user.id,
      submittedByRole: "hod",
      deptId: user.deptId!,
      section,
      payload:
        section === "target"
          ? { ...payload, sNo: targetOf(facultyId)?.sNo ?? facultyById(facultyId)?.sNo ?? 0 }
          : payload,
    });
  } else if (section === "profile") {
    await updateFacultyRecord(facultyId, payload);
  } else if (section === "research") {
    await setFacultyResearch(facultyId, payload);
  } else if (section === "target") {
    await setFacultyTarget(facultyId, targetOf(facultyId)?.sNo ?? facultyById(facultyId)?.sNo ?? 0, payload);
  } else {
    await setFacultyProjects(facultyId, payload.projects);
  }
  revalidatePath("/hod");
  revalidatePath(`/hod/faculty/${facultyId}`);
  revalidatePath(`/hod/faculty/${facultyId}/edit`);
  redirect(`/hod/faculty/${facultyId}/edit?submitted=1`);
}

export async function submitHodFacultyProfile(facultyId: string, form: FormData) {
  await hodFacultyEdit(facultyId, "profile", readFacultyProfile(form));
}

export async function submitHodFacultyResearch(facultyId: string, form: FormData) {
  await hodFacultyEdit(facultyId, "research", readFacultyResearch(form));
}

export async function submitHodFacultyTarget(facultyId: string, form: FormData) {
  await hodFacultyEdit(facultyId, "target", readFacultyTarget(form));
}

export async function submitHodFacultyProjects(facultyId: string, form: FormData) {
  await hodFacultyEdit(facultyId, "projects", { projects: readFacultyProjects(form) });
}

/** HoD edit of a room in their own department. */
export async function submitHodInfraEdit(infraId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  const infra = infrastructureById(infraId);
  if (!infra || infra.deptId !== user.deptId) throw new Error("That room is outside your department.");
  if (HOD_EDITS_NEED_APPROVAL) {
    await createChangeRequest({
      type: "edit",
      targetEntity: "Infrastructure",
      targetId: infraId,
      submittedByUserId: user.id,
      submittedByRole: "hod",
      deptId: infra.deptId,
      payload: readInfra(form),
    });
  } else {
    await updateInfrastructureRecord(infraId, readInfra(form));
  }
  revalidatePath("/hod");
  revalidatePath(`/hod/infra/${infraId}/edit`);
  redirect(`/hod/infra/${infraId}/edit?submitted=1`);
}

export type HodCreateFacultyResult =
  | { ok: true; facultyId: string; name: string; email: string; password: string }
  | { ok: true; facultyId: string; name: string; accountError: string }
  | { ok: false; error: string };

/**
 * HoD "Add faculty": takes ONLY the fields the HoD workbook's Faculty Details
 * sheet held, creates the record in the HoD's own department and auto-creates
 * the faculty login (email + temporary password, returned once for the HoD to
 * pass on). Faculty sign-in itself stays locked until FACULTY_LOGINS_ENABLED.
 */
export async function hodCreateFaculty(form: FormData): Promise<HodCreateFacultyResult> {
  const user = await requireUser(["hod"]);
  const name = str(form, "name");
  if (!name) return { ok: false, error: "Enter the faculty member's name." };
  const designation = str(form, "designation");
  if (!designation) return { ok: false, error: "Choose a designation." };
  if (allFaculty.some((f) => normalizeName(f.name) === normalizeName(name))) {
    return {
      ok: false,
      error: `${name} is already on record. Open the existing record to edit it (or ask Admin to add a second department).`,
    };
  }

  const facultyId = await addFacultyRecord([user.deptId!], {
    name,
    designation: designation as FacultyProfileEdit["designation"],
    appointmentType: strN(form, "appointmentType"),
    dateOfJoining: strN(form, "dateOfJoining"),
    hasPhd: triN(form, "hasPhd"),
    programmesAppointedFor: strN(form, "programmesAppointedFor"),
    teachingLoadHrsPerWeek: numN(form, "teachingLoadHrsPerWeek"),
    additionalResponsibility: strN(form, "additionalResponsibility"),
  });
  revalidatePath("/hod");

  try {
    const { email, password } = await createFacultyLogin({ facultyId, name, deptId: user.deptId! });
    return { ok: true, facultyId, name, email, password };
  } catch (e) {
    return { ok: true, facultyId, name, accountError: e instanceof Error ? e.message : "Could not create the login." };
  }
}

/* -- Programmes (intake vs admissions etc.) — HoD edits apply immediately. -- */

function readProgram(form: FormData): ProgramEdit {
  return {
    name: str(form, "name"),
    yearOfCommencement: numN(form, "yearOfCommencement"),
    modeOfProgramme: strN(form, "modeOfProgramme"),
    sanctionedFacultyPositions: {
      professor: numN(form, "posProfessor"),
      associateProfessor: numN(form, "posAssociate"),
      assistantProfessor: numN(form, "posAssistant"),
    },
    semesterFeeByYear: { y2024: numN(form, "fee2024"), y2025: numN(form, "fee2025"), y2026: numN(form, "fee2026") },
    sanctionedIntakeByYear: {
      y2024: numN(form, "intake2024"),
      y2025: numN(form, "intake2025"),
      y2026: numN(form, "intake2026"),
    },
    admittedByYear: { y2024: numN(form, "admitted2024"), y2025: numN(form, "admitted2025"), y2026: numN(form, "admitted2026") },
    nepAligned: triN(form, "nepAligned"),
    multipleEntryExit: triN(form, "multipleEntryExit"),
    internshipEndOfYear: triN(form, "internshipEndOfYear"),
    minorSpecialisationAvailable: triN(form, "minorSpecialisationAvailable"),
    remarks: strN(form, "remarks"),
  };
}

export async function hodUpdateProgram(programId: string, form: FormData) {
  const user = await requireUser(["hod"]);
  const p = programById(programId);
  if (!p || p.deptId !== user.deptId) throw new Error("That programme is outside your department.");
  await updateProgramRecord(programId, readProgram(form));
  revalidatePath("/hod");
  revalidatePath("/hod/programs");
  redirect(`/hod/programs/${programId}/edit?submitted=1`);
}

export async function hodAddProgram(form: FormData) {
  const user = await requireUser(["hod"]);
  if (!str(form, "name")) throw new Error("Programme name is required.");
  const id = await addProgramRecord(user.deptId!, readProgram(form));
  revalidatePath("/hod");
  revalidatePath("/hod/programs");
  redirect(`/hod/programs/${id}/edit?submitted=1`);
}

export async function hodAddInfra(form: FormData) {
  const user = await requireUser(["hod"]);
  if (!str(form, "labClassroomName")) throw new Error("Room name is required.");
  const id = await addInfrastructureRecord(user.deptId!, readInfra(form));
  revalidatePath("/hod");
  redirect(`/hod/infra/${id}/edit?submitted=1`);
}

/* ------------------------------------------------------------------ ET role */

export async function submitEtInfraEdit(infraId: string, form: FormData) {
  const user = await requireUser(["et"]);
  const infra = infrastructureById(infraId);
  if (!infra) throw new Error("Room not found.");
  await createChangeRequest({
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
  await updateDepartmentHod(deptId, { hodContact: str(form, "mobileContact"), hodName: str(form, "certificationSignedBy") || undefined });
  await updateHodSubmission(deptId, {
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
  await updateFacultyRecord(facultyId, readFacultyProfile(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyResearch(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  await setFacultyResearch(facultyId, readFacultyResearch(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyTarget(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  const existing = targetOf(facultyId);
  await setFacultyTarget(facultyId, existing?.sNo ?? facultyById(facultyId)?.sNo ?? 0, readFacultyTarget(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateFacultyProjects(facultyId: string, form: FormData) {
  await requireUser(["admin"]);
  await setFacultyProjects(facultyId, readFacultyProjects(form));
  revalidatePath(`/admin/faculty/${facultyId}`);
  redirect(`/admin/faculty/${facultyId}`);
}

export async function adminUpdateInfra(infraId: string, form: FormData) {
  await requireUser(["admin"]);
  await updateInfrastructureRecord(infraId, readInfra(form));
  revalidatePath("/admin/infrastructure");
  redirect("/admin/infrastructure");
}

export type AddFacultyResult = { ok: true; id: string } | { ok: false; errors: FacultyErrors };

/** Admin "Add Faculty". All writes go through lib/data/faculty.ts. */
export async function adminAddFaculty(input: FacultyInput): Promise<AddFacultyResult> {
  await requireUser(["admin"]);
  try {
    const rec = await createFaculty(input);
    revalidatePath("/admin");
    revalidatePath("/admin/faculty");
    return { ok: true, id: rec.id };
  } catch (e) {
    if (e instanceof FacultyValidationError) return { ok: false, errors: e.errors };
    throw e;
  }
}

export async function adminApprove(id: string, form: FormData) {
  const user = await requireUser(["admin"]);
  await approveChangeRequest(id, user.id, str(form, "reviewNotes") || undefined);
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

export async function adminReject(id: string, form: FormData) {
  const user = await requireUser(["admin"]);
  const reason = str(form, "reviewNotes");
  if (!reason) throw new Error("A rejection reason is required.");
  await rejectChangeRequest(id, user.id, reason);
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

/* -------------------------------------------------------------- Account settings */

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/** Self-service password change — available to any signed-in role. Also
 * clears profiles.must_change_password, ending the forced-change redirect
 * middleware.ts applies after login with a temp password. */
export async function changeOwnPassword(form: FormData): Promise<ChangePasswordResult> {
  const user = await requireUser(["vc", "registrar", "hod", "faculty", "et", "admin"]);
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Password changes require Supabase to be configured." };
  }

  const password = str(form, "password");
  const confirm = str(form, "confirmPassword");
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  const { error: profileError } = await createSupabaseAdminClient()
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: profileError.message };

  revalidatePath("/account/password");
  redirect(ROLE_HOME[user.role]);
}
