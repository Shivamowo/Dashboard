/**
 * NULLABILITY CONTRACT
 *
 * Every field sourced from the department Excel workbooks is nullable: a blank
 * cell imports as null and renders as "Not provided" (components/ui.tsx),
 * never as 0 or an empty string. A blank cell and a real 0 are different
 * facts — the workbooks contain both — so collapsing them would invent
 * figures the departments never reported. Identity fields the app generates
 * itself (id, deptId, facultyId, sNo) stay non-null.
 *
 * Several columns also carry free text where a tidy enum was expected
 * ("Achive" in a quarterly status cell, "As per BCI" in a yes/no cell). Those
 * widen to string so the real answer survives import; the display layer tones
 * anything it does not recognise as neutral.
 */

/** Canonical quarterly statuses. Source cells often hold free text instead. */
export type QuarterStatus = "On track" | "At risk" | "Delayed" | "Completed";
export type HodPriority = "High" | "Medium" | "Low";

export interface Department {
  id: string;
  /** Faculty/School or constituent institute this department sits under. */
  facultyOfEngineering: string | null;
  name: string;
  shortName: string;
  deanName: string | null;
  hodName: string | null;
  hodContact: string | null;
  reportingPeriod: string | null;
  dateOfSubmission: string | null;
  /** Set when the workbook named no department and the name came from its filename. */
  nameFromFilename?: boolean;
}

export interface ThreeYear {
  y2024: number | null;
  y2025: number | null;
  y2026: number | null;
}

export interface Program {
  id: string;
  deptId: string;
  sNo: number;
  name: string;
  yearOfCommencement: number | null;
  /** Free text — some workbooks put a programme name in this column. */
  modeOfProgramme: string | null;
  sanctionedFacultyPositions: {
    professor: number | null;
    associateProfessor: number | null;
    assistantProfessor: number | null;
  };
  semesterFeeByYear: ThreeYear;
  sanctionedIntakeByYear: ThreeYear;
  admittedByYear: ThreeYear;
  nepAligned: boolean | null;
  multipleEntryExit: boolean | null;
  internshipEndOfYear: boolean | null;
  minorSpecialisationAvailable: boolean | null;
  remarks: string | null;
}

export interface Faculty {
  id: string;
  /**
   * Every department this person serves. A person listed in several
   * departments is ONE record (deduped on employeeId, else normalised name —
   * see scripts/split-departments.ts). Each department view lists them in full.
   */
  departments: string[];
  /** Where the faculty-view breadcrumb routes. Always one of `departments`. */
  primaryDepartment: string;
  sNo: number;
  name: string;
  /** Not in the department workbooks; set through the admin Add Faculty form. */
  employeeId?: string | null;
  email?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  designation: string | null;
  appointmentType: string | null;
  /** ISO yyyy-mm-dd when the cell parsed as a date, else the original text. */
  dateOfJoining: string | null;
  /** null where the cell said something other than Yes/No (e.g. "Persuing"). */
  hasPhd: boolean | null;
  programmesAppointedFor: string | null;
  teachingLoadHrsPerWeek: number | null;
  additionalResponsibility: string | null;
}

export interface FacultyResearch {
  id: string;
  facultyId: string;
  journalPublications: {
    sciScieSsci: number | null;
    scopusUgcCare: number | null;
    other: number | null;
  };
  conferencePublications: { international: number | null; national: number | null };
  hIndex: number | null;
  i10Index: number | null;
  googleScholarOrcidLink: string | null;
  patents: { filed: number | null; published: number | null; granted: number | null };
  phdSupervision: { registered: number | null; awarded: number | null };
  /** Year-wise publication series used by the research output trend chart. */
  yearly: { year: number; journal: number; conference: number }[];
}

export interface FacultyProject {
  id: string;
  facultyId: string;
  sponsoringAgency: string | null;
  yearOfGrant: number | null;
  /** Free text — "3 Year", "Upto March 2028", "Co-PI with …" all occur. */
  duration: string | null;
  /** Rupees. null where the cell held something unquantifiable ("Beam Time"). */
  sanctionedAmount: number | null;
  amountReleased: number | null;
  currentStatus: string | null;
}

export interface Infrastructure {
  id: string;
  deptId: string;
  sNo: number;
  labClassroomName: string | null;
  floorRoomNo: string | null;
  hoursAllottedPerWeek: number | null;
  /** Department-level figure from the sheet header, not a per-room column. */
  currentWeeklyWorkingHours: number | null;
  labRoomInCharge: string | null;
  labAssistantSupportStaff: string | null;
  studentCapacity: number | null;
  majorEquipmentAvailable: string | null;
  programmesUsingFacility: string | null;
  utilisationPct: number | null;
  digitalSmartBoard: boolean | null;
  projector: boolean | null;
}

export interface HodSubmission {
  deptId: string;
  mobileContact: string | null;
  dateOfSubmission: string | null;
  /** As reported on the sheet's own snapshot block — not recomputed from rows. */
  snapshot: {
    noOfProgrammes: number | null;
    totalFacultyReported: number | null;
    totalSanctionedIntake2026: number | null;
    facultyWithPhd: number | null;
    totalStudentsAdmitted2026: number | null;
    labsClassroomsReported: number | null;
    programmesWithNepAlignment: number | null;
    digitalSmartBoardAvailable: number | null;
    projectorAvailable: number | null;
  };
  certificationSignedBy: string | null;
  certificationDate: string | null;
  status: "Submitted" | "Pending" | "Partial";
}

export interface DeptFacultyTargetSummary {
  deptId: string;
  reviewPeriod: string | null;
  totalFacultyPlanned: number | null;
  journalPublicationTarget: number | null;
  conferencePaperTarget: number | null;
  sponsoredIndustryProposalsTarget: number | null;
  targetFundingLakh: number | null;
  patentFilingTarget: number | null;
  avgMilestoneAchievement: number | null;
}

/**
 * Quarterly statuses and hodPriority are typed as free strings, not the
 * QuarterStatus/HodPriority unions: the real workbooks hold values like "--",
 * "Achive" and whole sentences in those cells. StatusBadge tones known labels
 * and falls back to neutral for the rest.
 */
export interface FacultyTarget {
  id: string;
  facultyId: string;
  sNo: number;
  designation: string | null;
  natureOfAppointment: string | null;
  dateOfJoining: string | null;
  reviewPeriod: string | null;
  sciSciESsciJournalPapers: number | null;
  scopusUgcCareJournalPapers: number | null;
  q1q2JournalPapersSubset: number | null;
  internationalConferencePapers: number | null;
  nationalConferencePapers: number | null;
  govtSponsoredProjectProposals: number | null;
  industryProjectProposals: number | null;
  targetFundingLakh: number | null;
  fundingAgenciesTargeted: string | null;
  tentativeProjectThemeTitle: string | null;
  targetSubmissionMonth: string | null;
  consultancyIndustryAssignmentProposals: number | null;
  patentsToBeFiled: number | null;
  patentsExpectedPublished: number | null;
  patentsExpectedGranted: number | null;
  prototypeProductTechnologyProposed: string | null;
  newRevisedCourseSyllabusOrLab: string | null;
  eContentMoocInnovativeTeaching: string | null;
  studentMentoringHackathonInternshipPlacement: string | null;
  contributionToDeptDevelopment: string | null;
  contributionToUniversityDevelopment: string | null;
  expectedMeasurableOutcomeByJune2027: string | null;
  q1Plan: string | null;
  q2Plan: string | null;
  q3Plan: string | null;
  q4Plan: string | null;
  q1Status: string | null;
  q2Status: string | null;
  q3Status: string | null;
  q4Status: string | null;
  milestoneAchievementPct: number | null;
  hodPriority: string | null;
  hodRemarksSupportRequired: string | null;
  yearEndAchievementSummary: string | null;
}

export type Role = "vc" | "registrar" | "hod" | "faculty" | "et" | "admin";

/**
 * "onboarding_incomplete" — account exists, no detailed onboarding submitted yet (or a
 * prior submission was rejected and needs correcting).
 * "pending_approval" — onboarding submitted, awaiting Admin review.
 * "active" — approved; normal dashboard access.
 * VC/Registrar/ET/Admin accounts are always "active" — onboarding only applies to Faculty/HoD.
 */
export type UserStatus = "onboarding_incomplete" | "pending_approval" | "active";

/** Mock user record — see lib/demo-accounts.ts and data/store.ts. */
export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: Role;
  displayName: string;
  /** Set for hod/faculty accounts — the department they belong to (or are onboarding into). */
  deptId?: string;
  /** Set for faculty accounts once their onboarding is approved and a Faculty record exists. */
  facultyId?: string;
  status: UserStatus;
  rejectionReason?: string;
  createdAt: string;
}

export type ChangeRequestType = "edit" | "onboarding";
export type ChangeRequestTargetEntity = "Faculty" | "HoD" | "Infrastructure";
export type ChangeRequestStatus = "pending" | "approved" | "rejected";
/** Which sub-entity of a Faculty record a 'Faculty'-targeted change request touches. */
export type FacultyChangeSection = "profile" | "research" | "projects" | "target";

/**
 * Drives both the edit-approval workflow and Faculty/HoD onboarding. Submitting
 * one does not touch the underlying record — only an Admin approval does, via
 * data/store.ts#approveChangeRequest.
 */
export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  targetEntity: ChangeRequestTargetEntity;
  /** null for onboarding — the record does not exist yet. */
  targetId: string | null;
  submittedByUserId: string;
  submittedByRole: Role;
  deptId: string;
  /** Only meaningful when targetEntity is 'Faculty'. */
  section?: FacultyChangeSection;
  /** Full proposed record (or sub-record) for the given targetEntity/section. */
  payload: Record<string, unknown>;
  status: ChangeRequestStatus;
  submittedAt: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
