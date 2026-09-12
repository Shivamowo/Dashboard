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

/**
 * IN-MEMORY DEMO STORE for users and the edit/approval workflow. Mutates the
 * module-level arrays in ./faculty, ./infrastructure, ./departments and
 * ./submissions directly on approval. This is a server-process singleton —
 * fine for the current frontend-only phase (see lib/demo-accounts.ts), not a
 * real persistence layer. State resets whenever the server restarts.
 */

const seedUsers = (): UserAccount[] => [
  { id: "u-vc", username: "vc-demo", password: "demo123", role: "vc", displayName: "Vice Chancellor", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "u-registrar", username: "registrar-demo", password: "demo123", role: "registrar", displayName: "Registrar", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "u-hod", username: "hod-demo", password: "demo123", role: "hod", displayName: "Head of Department", deptId: "cse", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "u-faculty", username: "faculty-demo", password: "demo123", role: "faculty", displayName: "Faculty Member", deptId: "cse", facultyId: "cse-f2", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "u-et", username: "et-demo", password: "demo123", role: "et", displayName: "Engineering & Technical", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "u-admin", username: "admin-demo", password: "demo123", role: "admin", displayName: "Administrator", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
];

export const users: UserAccount[] = globalSingleton("users", seedUsers);
export const changeRequests: ChangeRequest[] = globalSingleton("changeRequests", () => []);
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

/** Faculty/HoD self-service signup. Account is created immediately; the record it
 * represents is created only once the paired onboarding ChangeRequest is approved. */
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
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
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
      const fid = addFacultyRecord(cr.deptId, cr.payload as FacultyProfileEdit);
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
      user.status = "rejected";
      user.rejectionReason = reviewNotes;
    }
  }
}
