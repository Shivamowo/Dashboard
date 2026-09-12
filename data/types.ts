export type QuarterStatus = "On track" | "At risk" | "Delayed" | "Completed";
export type HodPriority = "High" | "Medium" | "Low";

export interface Department {
  id: string;
  facultyOfEngineering: string;
  name: string;
  shortName: string;
  deanName: string;
  hodName: string;
  hodContact: string;
  reportingPeriod: string;
  dateOfSubmission: string;
}

export interface ThreeYear {
  y2024: number;
  y2025: number;
  y2026: number;
}

export interface Program {
  id: string;
  deptId: string;
  sNo: number;
  name: string;
  yearOfCommencement: number;
  modeOfProgramme: "Regular" | "Self-Financing" | "Regular (Aided)";
  sanctionedFacultyPositions: {
    professor: number;
    associateProfessor: number;
    assistantProfessor: number;
  };
  semesterFeeByYear: ThreeYear;
  sanctionedIntakeByYear: ThreeYear;
  admittedByYear: ThreeYear;
  nepAligned: boolean;
  multipleEntryExit: boolean;
  internshipEndOfYear: boolean;
  minorSpecialisationAvailable: boolean;
  remarks: string;
}

export interface Faculty {
  id: string;
  deptId: string;
  sNo: number;
  name: string;
  designation:
    | "Professor"
    | "Associate Professor"
    | "Assistant Professor"
    | "Guest Faculty";
  appointmentType: "Regular" | "Contractual" | "Self-Financing" | "Guest";
  dateOfJoining: string;
  hasPhd: boolean;
  programmesAppointedFor: string;
  teachingLoadHrsPerWeek: number;
  additionalResponsibility: string;
}

export interface FacultyResearch {
  id: string;
  facultyId: string;
  journalPublications: { sciScieSsci: number; scopusUgcCare: number; other: number };
  conferencePublications: { international: number; national: number };
  hIndex: number;
  i10Index: number;
  googleScholarOrcidLink: string;
  patents: { filed: number; published: number; granted: number };
  phdSupervision: { registered: number; awarded: number };
  /** Year-wise publication series used by the research output trend chart. */
  yearly: { year: number; journal: number; conference: number }[];
}

export interface FacultyProject {
  id: string;
  facultyId: string;
  sponsoringAgency: string;
  yearOfGrant: number;
  duration: string;
  sanctionedAmount: number;
  amountReleased: number;
  currentStatus: "Ongoing" | "Completed" | "Submitted" | "Sanctioned" | "Closed";
}

export interface Infrastructure {
  id: string;
  deptId: string;
  sNo: number;
  labClassroomName: string;
  floorRoomNo: string;
  hoursAllottedPerWeek: number;
  currentWeeklyWorkingHours: number;
  labRoomInCharge: string;
  labAssistantSupportStaff: string;
  studentCapacity: number;
  majorEquipmentAvailable: string;
  programmesUsingFacility: string;
  utilisationPct: number;
  digitalSmartBoard: boolean;
  projector: boolean;
}

export interface HodSubmission {
  deptId: string;
  mobileContact: string;
  dateOfSubmission: string;
  snapshot: {
    noOfProgrammes: number;
    totalFacultyReported: number;
    totalSanctionedIntake2026: number;
    facultyWithPhd: number;
    totalStudentsAdmitted2026: number;
    labsClassroomsReported: number;
    programmesWithNepAlignment: number;
    digitalSmartBoardAvailable: number;
    projectorAvailable: number;
  };
  certificationSignedBy: string;
  certificationDate: string;
  status: "Submitted" | "Pending" | "Partial";
}

export interface DeptFacultyTargetSummary {
  deptId: string;
  reviewPeriod: string;
  totalFacultyPlanned: number;
  journalPublicationTarget: number;
  conferencePaperTarget: number;
  sponsoredIndustryProposalsTarget: number;
  targetFundingLakh: number;
  patentFilingTarget: number;
  avgMilestoneAchievement: number;
}

export interface FacultyTarget {
  id: string;
  facultyId: string;
  sNo: number;
  designation: string;
  natureOfAppointment: string;
  dateOfJoining: string;
  reviewPeriod: string;
  sciSciESsciJournalPapers: number;
  scopusUgcCareJournalPapers: number;
  q1q2JournalPapersSubset: number;
  internationalConferencePapers: number;
  nationalConferencePapers: number;
  govtSponsoredProjectProposals: number;
  industryProjectProposals: number;
  targetFundingLakh: number;
  fundingAgenciesTargeted: string;
  tentativeProjectThemeTitle: string;
  targetSubmissionMonth: string;
  consultancyIndustryAssignmentProposals: number;
  patentsToBeFiled: number;
  patentsExpectedPublished: number;
  patentsExpectedGranted: number;
  prototypeProductTechnologyProposed: string;
  newRevisedCourseSyllabusOrLab: string;
  eContentMoocInnovativeTeaching: string;
  studentMentoringHackathonInternshipPlacement: string;
  contributionToDeptDevelopment: string;
  contributionToUniversityDevelopment: string;
  expectedMeasurableOutcomeByJune2027: string;
  q1Plan: string;
  q2Plan: string;
  q3Plan: string;
  q4Plan: string;
  q1Status: QuarterStatus;
  q2Status: QuarterStatus;
  q3Status: QuarterStatus;
  q4Status: QuarterStatus;
  milestoneAchievementPct: number;
  hodPriority: HodPriority;
  hodRemarksSupportRequired: string;
  yearEndAchievementSummary: string;
}

export type Role = "vc" | "registrar" | "hod" | "faculty" | "et";
