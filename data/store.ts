import type {
  ChangeRequest,
  ChangeRequestTargetEntity,
  ChangeRequestType,
  FacultyChangeSection,
  Role,
  UserAccount,
} from "./types";
import { departmentById, updateDepartmentHod } from "./departments";
import {
  addFacultyRecord,
  setFacultyProjects,
  setFacultyResearch,
  setFacultyTarget,
  updateFacultyRecord,
  type FacultyProfileEdit,
  type FacultyProjectEdit,
  type FacultyResearchEdit,
  type FacultyTargetEdit,
} from "./faculty";
import { updateInfrastructureRecord, type InfrastructureEdit } from "./infrastructure";
import { updateHodSubmission } from "./submissions";
import { globalSingleton } from "./globalStore";
import { departments } from "./departments";
import { faculty as facultyRecords } from "./faculty";

/**
 * Demo accounts are scoped to whichever dataset is loaded.
 *
 * The HoD and Faculty logins need a department (and a faculty record) that
 * actually exists. Hard-coding "cse" worked against the mock generator but
 * points at nothing once the real imported departments are in play, and a
 * session scoped to a missing department crashes the page it lands on. These
 * resolve at seed time instead: a named department when the dataset has one,
 * otherwise simply the first available.
 */
const deptIdFor = (...preferred: string[]): string | undefined => {
  for (const id of preferred) {
    if (departments.some((d) => d.id === id)) return id;
  }
  return departments[0]?.id;
};

/** A department that actually has faculty, so the Faculty demo view is populated. */
const populatedDeptId = (): string | undefined =>
  departments.find((d) => facultyRecords.some((f) => f.deptId === d.id))?.id ?? departments[0]?.id;

const firstFacultyIdIn = (deptId: string | undefined): string | undefined =>
  deptId ? facultyRecords.find((f) => f.deptId === deptId)?.id : undefined;

/**
 * IN-MEMORY DEMO STORE for users and the edit/approval workflow. Mutates the
 * module-level arrays in ./faculty, ./infrastructure, ./departments and
 * ./submissions directly on approval. This is a server-process singleton —
 * fine for the current frontend-only phase (see lib/demo-accounts.ts), not a
 * real persistence layer. State resets whenever the server restarts.
 */

const seedUsers = (): UserAccount[] => {
  const hodDept = deptIdFor("cse-and-it", "cse");
  const facDept = populatedDeptId();
  const facId = firstFacultyIdIn(facDept);
  return [
    { id: "u-vc", username: "vc-demo", password: "demo123", role: "vc", displayName: "Vice Chancellor", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-registrar", username: "registrar-demo", password: "demo123", role: "registrar", displayName: "Registrar", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-hod", username: "hod-demo", password: "demo123", role: "hod", displayName: "Head of Department", deptId: hodDept, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-faculty", username: "faculty-demo", password: "demo123", role: "faculty", displayName: "Faculty Member", deptId: facDept, facultyId: facId, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-et", username: "et-demo", password: "demo123", role: "et", displayName: "Engineering & Technical", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-admin", username: "admin-demo", password: "demo123", role: "admin", displayName: "Administrator", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  ];
};

/**
 * Accounts that sit mid-onboarding so those screens stay demonstrable.
 *
 * Self-service signups only live in this process (see the note above), so a
 * restart, redeploy or a second instance wipes them out. Without these the
 * "onboarding_incomplete" and "pending_approval" screens — and the Admin
 * approvals queue — could only be reached by signing up and then never
 * letting the server restart. Seeding them keeps the demo reproducible from
 * a cold start. Same password as the rest: demo123.
 */
const seedOnboardingUsers = (): UserAccount[] => {
  const a = deptIdFor("cse-and-it", "cse");
  const b = deptIdFor("computer-applications", "it");
  const c = deptIdFor("mechanical-engineering", "ece");
  return [
    { id: "u-seed-faculty-new", username: "faculty-new", password: "demo123", role: "faculty", displayName: "Aarti Verma", deptId: a, status: "onboarding_incomplete", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-seed-hod-new", username: "hod-new", password: "demo123", role: "hod", displayName: "Sanjay Mishra", deptId: b, status: "onboarding_incomplete", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-seed-faculty-pending", username: "faculty-pending", password: "demo123", role: "faculty", displayName: "Rohit Yadav", deptId: a, status: "pending_approval", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "u-seed-hod-pending", username: "hod-pending", password: "demo123", role: "hod", displayName: "Neha Gupta", deptId: c, status: "pending_approval", createdAt: "2026-01-01T00:00:00.000Z" },
  ];
};

/**
 * Typed exactly as applyChangeRequest below casts it, so a drift between this
 * seed and the Faculty edit shapes is a compile error rather than a crash at
 * approval time.
 */
const seedFacultyOnboardingPayload: {
  profile: FacultyProfileEdit;
  research: FacultyResearchEdit;
  projects: FacultyProjectEdit[];
} = {
  profile: {
    name: "Rohit Yadav",
    designation: "Assistant Professor",
    appointmentType: "Contractual",
    dateOfJoining: "2025-08-01",
    hasPhd: false,
    programmesAppointedFor: "B.Tech CSE",
    teachingLoadHrsPerWeek: 16,
    additionalResponsibility: "NA",
  },
  research: {
    journalPublications: { sciScieSsci: 1, scopusUgcCare: 2, other: 0 },
    conferencePublications: { international: 1, national: 2 },
    hIndex: 2,
    i10Index: 1,
    googleScholarOrcidLink: "",
    patents: { filed: 0, published: 0, granted: 0 },
    phdSupervision: { registered: 0, awarded: 0 },
  },
  projects: [],
};

/** The submissions the two "pending_approval" accounts above are waiting on. */
const seedChangeRequests = (): ChangeRequest[] => {
  const byUser = new Map(seedOnboardingUsers().map((u) => [u.id, u.deptId]));
  const deptOf = (userId: string) => byUser.get(userId) ?? departments[0]?.id ?? "";
  return [
  {
    id: "cr-seed-1",
    type: "onboarding",
    targetEntity: "Faculty",
    targetId: null,
    submittedByUserId: "u-seed-faculty-pending",
    submittedByRole: "faculty",
    deptId: deptOf("u-seed-faculty-pending"),
    status: "pending",
    submittedAt: "2026-01-02T09:00:00.000Z",
    payload: seedFacultyOnboardingPayload,
  },
  {
    id: "cr-seed-2",
    type: "onboarding",
    targetEntity: "HoD",
    targetId: null,
    submittedByUserId: "u-seed-hod-pending",
    submittedByRole: "hod",
    deptId: deptOf("u-seed-hod-pending"),
    status: "pending",
    submittedAt: "2026-01-02T10:30:00.000Z",
    payload: { name: "Neha Gupta", mobileContact: "9450011223" },
  },
  ];
};

export const users: UserAccount[] = globalSingleton("users", () => [
  ...seedUsers(),
  ...seedOnboardingUsers(),
]);
export const changeRequests: ChangeRequest[] = globalSingleton("changeRequests", seedChangeRequests);
// Generated ids are "u-signup-<n>"/"cr-<n>"; the seeds above use "u-seed-*"/
// "cr-seed-*" prefixes, so these counters cannot collide with them.
const seq = globalSingleton("idSeq", () => ({ user: 1, cr: 1 }));

/* --------------------------------------------------------------------- users */

export function findUserByCredentials(username: string, password: string) {
  const u = username.trim().toLowerCase();
  return users.find((a) => a.username === u && a.password === password);
}

export function findUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function findUserByUsername(username: string) {
  return users.find((u) => u.username === username.trim().toLowerCase());
}

/**
 * Faculty/HoD self-service signup — account creation only (username, password,
 * department, display name). No record and no ChangeRequest exist yet: the
 * account starts "onboarding_incomplete" until the separate onboarding step
 * (submitOnboarding below) is completed. See app/api/signup/route.ts.
 */
export function createUserAccount(input: {
  username: string;
  password: string;
  role: "faculty" | "hod";
  displayName: string;
  deptId: string;
}): UserAccount {
  if (findUserByUsername(input.username)) {
    throw new Error("That username is already taken.");
  }
  const user: UserAccount = {
    id: "u-signup-" + seq.user++,
    username: input.username.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    displayName: input.displayName,
    deptId: input.deptId,
    status: "onboarding_incomplete",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

/**
 * Submits the detailed onboarding form (post-signup, pre-dashboard-access) as
 * a pending 'onboarding' ChangeRequest and moves the account to
 * "pending_approval". Also used to resubmit after a rejection.
 */
export function submitOnboarding(input: {
  userId: string;
  targetEntity: "Faculty" | "HoD";
  deptId: string;
  payload: Record<string, unknown>;
}): ChangeRequest {
  const user = findUserById(input.userId);
  if (!user) throw new Error("Unknown user.");
  const cr = createChangeRequest({
    type: "onboarding",
    targetEntity: input.targetEntity,
    targetId: null,
    submittedByUserId: input.userId,
    submittedByRole: user.role,
    deptId: input.deptId,
    payload: input.payload,
  });
  user.status = "pending_approval";
  user.rejectionReason = undefined;
  return cr;
}

/* ---------------------------------------------------------- change requests */

export function createChangeRequest(input: {
  type: ChangeRequestType;
  targetEntity: ChangeRequestTargetEntity;
  targetId: string | null;
  submittedByUserId: string;
  submittedByRole: Role;
  deptId: string;
  section?: FacultyChangeSection;
  payload: Record<string, unknown>;
}): ChangeRequest {
  const cr: ChangeRequest = {
    id: "cr-" + seq.cr++,
    status: "pending",
    submittedAt: new Date().toISOString(),
    ...input,
  };
  changeRequests.push(cr);
  return cr;
}

export const changeRequestById = (id: string) => changeRequests.find((c) => c.id === id);

export const pendingChangeRequests = () =>
  changeRequests
    .filter((c) => c.status === "pending")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

export const reviewedChangeRequests = () =>
  changeRequests
    .filter((c) => c.status !== "pending")
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));

/** Faculty ids with a pending edit awaiting approval — for the "Pending approval" badge. */
export const pendingFacultyEditIds = (): Set<string> =>
  new Set(
    changeRequests
      .filter((c) => c.status === "pending" && c.type === "edit" && c.targetEntity === "Faculty" && c.targetId)
      .map((c) => c.targetId as string)
  );

/** Infrastructure ids with a pending edit awaiting approval. */
export const pendingInfraIds = (): Set<string> =>
  new Set(
    changeRequests
      .filter((c) => c.status === "pending" && c.targetEntity === "Infrastructure" && c.targetId)
      .map((c) => c.targetId as string)
  );

/** Departments with a pending HoD edit or onboarding awaiting approval. */
export const pendingHodDeptIds = (): Set<string> =>
  new Set(changeRequests.filter((c) => c.status === "pending" && c.targetEntity === "HoD").map((c) => c.deptId));

export const pendingFor = (
  targetEntity: ChangeRequestTargetEntity,
  targetId: string,
  section?: FacultyChangeSection
) =>
  changeRequests.find(
    (c) =>
      c.status === "pending" &&
      c.targetEntity === targetEntity &&
      c.targetId === targetId &&
      (section === undefined || c.section === section)
  );

export const pendingHodEditFor = (deptId: string) =>
  changeRequests.find((c) => c.status === "pending" && c.targetEntity === "HoD" && c.type === "edit" && c.deptId === deptId);

export const requestsSubmittedByUser = (userId: string) =>
  changeRequests
    .filter((c) => c.submittedByUserId === userId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

export const latestOnboardingForUser = (userId: string) =>
  changeRequests
    .filter((c) => c.type === "onboarding" && c.submittedByUserId === userId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

export const pendingSectionForFaculty = (facultyId: string, section: FacultyChangeSection) =>
  pendingFor("Faculty", facultyId, section);

/* ------------------------------------------------------------ applying a CR */

function applyChangeRequest(cr: ChangeRequest) {
  if (cr.targetEntity === "Faculty") {
    if (cr.type === "onboarding") {
      const dept = departmentById(cr.deptId);
      if (!dept) return;
      const payload = cr.payload as {
        profile: FacultyProfileEdit;
        research: FacultyResearchEdit;
        projects: FacultyProjectEdit[];
      };
      const fid = addFacultyRecord(cr.deptId, payload.profile);
      setFacultyResearch(fid, payload.research);
      setFacultyProjects(fid, payload.projects ?? []);
      const user = findUserById(cr.submittedByUserId);
      if (user) user.facultyId = fid;
    } else if (cr.targetId) {
      const section = cr.section ?? "profile";
      if (section === "research") setFacultyResearch(cr.targetId, cr.payload as FacultyResearchEdit);
      else if (section === "projects")
        setFacultyProjects(cr.targetId, (cr.payload as { projects: FacultyProjectEdit[] }).projects);
      else if (section === "target") {
        const sNo = (cr.payload as { sNo?: number }).sNo ?? 0;
        setFacultyTarget(cr.targetId, sNo, cr.payload as FacultyTargetEdit);
      } else updateFacultyRecord(cr.targetId, cr.payload as FacultyProfileEdit);
    }
  } else if (cr.targetEntity === "HoD") {
    const payload = cr.payload as {
      name?: string;
      mobileContact?: string;
      certificationSignedBy?: string;
      certificationDate?: string;
    };
    if (cr.type === "onboarding") {
      updateDepartmentHod(cr.deptId, { hodName: payload.name, hodContact: payload.mobileContact });
      updateHodSubmission(cr.deptId, { mobileContact: payload.mobileContact, certificationSignedBy: payload.name });
      const user = findUserById(cr.submittedByUserId);
      if (user) user.deptId = cr.deptId;
    } else {
      updateHodSubmission(cr.deptId, payload);
      if (payload.mobileContact) updateDepartmentHod(cr.deptId, { hodContact: payload.mobileContact });
    }
  } else if (cr.targetEntity === "Infrastructure" && cr.targetId) {
    updateInfrastructureRecord(cr.targetId, cr.payload as InfrastructureEdit);
  }
}

export function approveChangeRequest(id: string, reviewerId: string, reviewNotes?: string) {
  const cr = changeRequestById(id);
  if (!cr || cr.status !== "pending") return;
  applyChangeRequest(cr);
  cr.status = "approved";
  cr.reviewedByUserId = reviewerId;
  cr.reviewedAt = new Date().toISOString();
  cr.reviewNotes = reviewNotes;
  if (cr.type === "onboarding") {
    const user = findUserById(cr.submittedByUserId);
    if (user) {
      user.status = "active";
      user.rejectionReason = undefined;
    }
  }
}

/** On rejection an onboarding submission sends the account back to
 * "onboarding_incomplete" (not a separate 'rejected' status) so the user is
 * routed back to the onboarding form to correct and resubmit. */
export function rejectChangeRequest(id: string, reviewerId: string, reviewNotes: string) {
  const cr = changeRequestById(id);
  if (!cr || cr.status !== "pending") return;
  cr.status = "rejected";
  cr.reviewedByUserId = reviewerId;
  cr.reviewedAt = new Date().toISOString();
  cr.reviewNotes = reviewNotes;
  if (cr.type === "onboarding") {
    const user = findUserById(cr.submittedByUserId);
    if (user) {
      user.status = "onboarding_incomplete";
      user.rejectionReason = reviewNotes;
    }
  }
}
