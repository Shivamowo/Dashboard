import "server-only";
import { createSupabaseAdminClient } from "./admin";
import type {
  ChangeRequest,
  ChangeRequestStatus,
  ChangeRequestTargetEntity,
  ChangeRequestType,
  Department,
  DeptFacultyTargetSummary,
  Faculty,
  FacultyChangeSection,
  FacultyProject,
  FacultyResearch,
  FacultyTarget,
  HodSubmission,
  Infrastructure,
  Program,
  Role,
  UserAccount,
  UserStatus,
} from "@/data/types";

export interface SupabaseSnapshot {
  departments: Department[];
  programs: Program[];
  faculty: Faculty[];
  facultyResearch: FacultyResearch[];
  facultyProjects: FacultyProject[];
  facultyTargets: FacultyTarget[];
  facultyTargetSummaries: DeptFacultyTargetSummary[];
  infrastructure: Infrastructure[];
  hodSubmissions: HodSubmission[];
  changeRequests: ChangeRequest[];
  users: UserAccount[];
}

let snapshot: SupabaseSnapshot | null = null;

/** Null until loadSupabaseSnapshot() has completed (see instrumentation.ts). */
export function getSupabaseSnapshot(): SupabaseSnapshot | null {
  return snapshot;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function mapDepartment(r: Row): Department {
  return {
    id: r.id,
    facultyOfEngineering: r.faculty_of_engineering,
    name: r.name,
    shortName: r.short_name,
    deanName: r.dean_name,
    hodName: r.hod_name,
    hodContact: r.hod_contact,
    reportingPeriod: r.reporting_period,
    dateOfSubmission: r.date_of_submission,
    nameFromFilename: r.name_from_filename,
  };
}

function mapProgram(r: Row): Program {
  return {
    id: r.id,
    deptId: r.dept_id,
    sNo: r.s_no,
    name: r.name,
    yearOfCommencement: r.year_of_commencement,
    modeOfProgramme: r.mode_of_programme,
    sanctionedFacultyPositions: {
      professor: r.sanctioned_professor,
      associateProfessor: r.sanctioned_associate_professor,
      assistantProfessor: r.sanctioned_assistant_professor,
    },
    semesterFeeByYear: { y2024: r.semester_fee_2024, y2025: r.semester_fee_2025, y2026: r.semester_fee_2026 },
    sanctionedIntakeByYear: {
      y2024: r.sanctioned_intake_2024,
      y2025: r.sanctioned_intake_2025,
      y2026: r.sanctioned_intake_2026,
    },
    admittedByYear: { y2024: r.admitted_2024, y2025: r.admitted_2025, y2026: r.admitted_2026 },
    nepAligned: r.nep_aligned,
    multipleEntryExit: r.multiple_entry_exit,
    internshipEndOfYear: r.internship_end_of_year,
    minorSpecialisationAvailable: r.minor_specialisation_available,
    remarks: r.remarks,
  };
}

function mapFaculty(r: Row, departmentsByFaculty: Map<string, string[]>): Faculty {
  return {
    id: r.id,
    departments: departmentsByFaculty.get(r.id) ?? [r.dept_id],
    primaryDepartment: r.dept_id,
    sNo: r.s_no,
    name: r.name,
    designation: r.designation,
    appointmentType: r.appointment_type,
    dateOfJoining: r.date_of_joining,
    hasPhd: r.has_phd,
    programmesAppointedFor: r.programmes_appointed_for,
    teachingLoadHrsPerWeek: r.teaching_load_hrs_per_week,
    additionalResponsibility: r.additional_responsibility,
  };
}

function mapFacultyResearch(r: Row): FacultyResearch {
  return {
    id: r.id,
    facultyId: r.faculty_id,
    journalPublications: {
      sciScieSsci: r.journal_sci_scie_ssci,
      scopusUgcCare: r.journal_scopus_ugc_care,
      other: r.journal_other,
    },
    conferencePublications: { international: r.conference_international, national: r.conference_national },
    hIndex: r.h_index,
    i10Index: r.i10_index,
    googleScholarOrcidLink: r.google_scholar_orcid_link,
    patents: { filed: r.patents_filed, published: r.patents_published, granted: r.patents_granted },
    phdSupervision: { registered: r.phd_registered, awarded: r.phd_awarded },
    yearly: [],
  };
}

function mapFacultyProject(r: Row): FacultyProject {
  return {
    id: r.id,
    facultyId: r.faculty_id,
    sponsoringAgency: r.sponsoring_agency,
    yearOfGrant: r.year_of_grant,
    duration: r.duration,
    sanctionedAmount: r.sanctioned_amount,
    amountReleased: r.amount_released,
    currentStatus: r.current_status,
  };
}

function mapFacultyTarget(r: Row): FacultyTarget {
  return {
    id: r.id,
    facultyId: r.faculty_id,
    sNo: r.s_no,
    designation: r.designation,
    natureOfAppointment: r.nature_of_appointment,
    dateOfJoining: r.date_of_joining,
    reviewPeriod: r.review_period,
    sciSciESsciJournalPapers: r.sci_scie_ssci_journal_papers,
    scopusUgcCareJournalPapers: r.scopus_ugc_care_journal_papers,
    q1q2JournalPapersSubset: r.q1q2_journal_papers_subset,
    internationalConferencePapers: r.international_conference_papers,
    nationalConferencePapers: r.national_conference_papers,
    govtSponsoredProjectProposals: r.govt_sponsored_project_proposals,
    industryProjectProposals: r.industry_project_proposals,
    targetFundingLakh: r.target_funding_lakh,
    fundingAgenciesTargeted: r.funding_agencies_targeted,
    tentativeProjectThemeTitle: r.tentative_project_theme_title,
    targetSubmissionMonth: r.target_submission_month,
    consultancyIndustryAssignmentProposals: r.consultancy_industry_assignment_proposals,
    patentsToBeFiled: r.patents_to_be_filed,
    patentsExpectedPublished: r.patents_expected_published,
    patentsExpectedGranted: r.patents_expected_granted,
    prototypeProductTechnologyProposed: r.prototype_product_technology_proposed,
    newRevisedCourseSyllabusOrLab: r.new_revised_course_syllabus_or_lab,
    eContentMoocInnovativeTeaching: r.e_content_mooc_innovative_teaching,
    studentMentoringHackathonInternshipPlacement: r.student_mentoring_hackathon_internship_placement,
    contributionToDeptDevelopment: r.contribution_to_dept_development,
    contributionToUniversityDevelopment: r.contribution_to_university_development,
    expectedMeasurableOutcomeByJune2027: r.expected_measurable_outcome_by_june_2027,
    q1Plan: r.q1_plan,
    q2Plan: r.q2_plan,
    q3Plan: r.q3_plan,
    q4Plan: r.q4_plan,
    q1Status: r.q1_status,
    q2Status: r.q2_status,
    q3Status: r.q3_status,
    q4Status: r.q4_status,
    milestoneAchievementPct: r.milestone_achievement_pct,
    hodPriority: r.hod_priority,
    hodRemarksSupportRequired: r.hod_remarks_support_required,
    yearEndAchievementSummary: r.year_end_achievement_summary,
  };
}

function mapTargetSummary(r: Row): DeptFacultyTargetSummary {
  return {
    deptId: r.dept_id,
    reviewPeriod: r.review_period,
    totalFacultyPlanned: r.total_faculty_planned,
    journalPublicationTarget: r.journal_publication_target,
    conferencePaperTarget: r.conference_paper_target,
    sponsoredIndustryProposalsTarget: r.sponsored_industry_proposals_target,
    targetFundingLakh: r.target_funding_lakh,
    patentFilingTarget: r.patent_filing_target,
    avgMilestoneAchievement: r.avg_milestone_achievement,
  };
}

function mapInfrastructure(r: Row): Infrastructure {
  return {
    id: r.id,
    deptId: r.dept_id,
    sNo: r.s_no,
    labClassroomName: r.lab_classroom_name,
    floorRoomNo: r.floor_room_no,
    hoursAllottedPerWeek: r.hours_allotted_per_week,
    currentWeeklyWorkingHours: r.current_weekly_working_hours,
    labRoomInCharge: r.lab_room_in_charge,
    labAssistantSupportStaff: r.lab_assistant_support_staff,
    studentCapacity: r.student_capacity,
    majorEquipmentAvailable: r.major_equipment_available,
    programmesUsingFacility: r.programmes_using_facility,
    utilisationPct: r.utilisation_pct,
    digitalSmartBoard: r.digital_smart_board,
    projector: r.projector,
  };
}

function mapHodSubmission(r: Row): HodSubmission {
  return {
    deptId: r.dept_id,
    mobileContact: r.mobile_contact,
    dateOfSubmission: r.date_of_submission,
    snapshot: {
      noOfProgrammes: r.snapshot_no_of_programmes,
      totalFacultyReported: r.snapshot_total_faculty_reported,
      totalSanctionedIntake2026: r.snapshot_total_sanctioned_intake_2026,
      facultyWithPhd: r.snapshot_faculty_with_phd,
      totalStudentsAdmitted2026: r.snapshot_total_students_admitted_2026,
      labsClassroomsReported: r.snapshot_labs_classrooms_reported,
      programmesWithNepAlignment: r.snapshot_programmes_with_nep_alignment,
      digitalSmartBoardAvailable: r.snapshot_digital_smart_board_available,
      projectorAvailable: r.snapshot_projector_available,
    },
    certificationSignedBy: r.certification_signed_by,
    certificationDate: r.certification_date,
    status: r.status,
  };
}

function mapChangeRequest(r: Row): ChangeRequest {
  return {
    id: r.id,
    type: r.type as ChangeRequestType,
    targetEntity: r.target_entity as ChangeRequestTargetEntity,
    targetId: r.target_id,
    submittedByUserId: r.submitted_by_user_id,
    submittedByRole: r.submitted_by_role as Role,
    deptId: r.dept_id,
    section: r.section as FacultyChangeSection | undefined,
    payload: r.payload,
    status: r.status as ChangeRequestStatus,
    submittedAt: r.submitted_at,
    reviewedByUserId: r.reviewed_by_user_id ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    reviewNotes: r.review_notes ?? undefined,
  };
}

/**
 * Fetches every table from Supabase once and caches it in-process. Called
 * from instrumentation.ts at server boot; data/source.ts merges this over the
 * Excel-imported JSON (Supabase wins on id match), and the write-through
 * mutators in data/*.ts keep the in-memory arrays fresh between boots.
 */
export async function loadSupabaseSnapshot(): Promise<void> {
  const db = createSupabaseAdminClient();
  const [
    depts,
    progs,
    fac,
    facDepts,
    research,
    projects,
    targets,
    targetSummaries,
    infra,
    hodSubs,
    changeRequests,
    profiles,
    authUsers,
  ] = await Promise.all([
    db.from("departments").select("*"),
    db.from("programs").select("*"),
    db.from("faculty").select("*"),
    db.from("faculty_departments").select("*"),
    db.from("faculty_research").select("*"),
    db.from("faculty_projects").select("*"),
    db.from("faculty_targets").select("*"),
    db.from("faculty_target_summaries").select("*"),
    db.from("infrastructure").select("*"),
    db.from("hod_submissions").select("*"),
    db.from("change_requests").select("*"),
    db.from("profiles").select("*"),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  for (const [name, res] of Object.entries({
    depts,
    progs,
    fac,
    facDepts,
    research,
    projects,
    targets,
    targetSummaries,
    infra,
    hodSubs,
    changeRequests,
    profiles,
  })) {
    if ((res as { error?: unknown }).error) {
      console.error(`[supabase snapshot] failed to load ${name}:`, (res as { error: unknown }).error);
    }
  }

  const deptsByFaculty = new Map<string, string[]>();
  for (const row of (facDepts.data as Row[]) ?? []) {
    const list = deptsByFaculty.get(row.faculty_id) ?? [];
    list.push(row.dept_id);
    deptsByFaculty.set(row.faculty_id, list);
  }

  const emailById = new Map((authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const users: UserAccount[] = ((profiles.data as Row[]) ?? []).map((p) => ({
    id: p.id,
    username: emailById.get(p.id) ?? "",
    password: "",
    role: p.role as Role,
    displayName: p.display_name,
    deptId: p.dept_id ?? undefined,
    facultyId: p.faculty_id ?? undefined,
    status: p.status as UserStatus,
    rejectionReason: p.rejection_reason ?? undefined,
    createdAt: p.created_at,
    mustChangePassword: p.must_change_password,
  }));

  snapshot = {
    departments: ((depts.data as Row[]) ?? []).map(mapDepartment),
    programs: ((progs.data as Row[]) ?? []).map(mapProgram),
    faculty: ((fac.data as Row[]) ?? []).map((r) => mapFaculty(r, deptsByFaculty)),
    facultyResearch: ((research.data as Row[]) ?? []).map(mapFacultyResearch),
    facultyProjects: ((projects.data as Row[]) ?? []).map(mapFacultyProject),
    facultyTargets: ((targets.data as Row[]) ?? []).map(mapFacultyTarget),
    facultyTargetSummaries: ((targetSummaries.data as Row[]) ?? []).map(mapTargetSummary),
    infrastructure: ((infra.data as Row[]) ?? []).map(mapInfrastructure),
    hodSubmissions: ((hodSubs.data as Row[]) ?? []).map(mapHodSubmission),
    changeRequests: ((changeRequests.data as Row[]) ?? []).map(mapChangeRequest),
    users,
  };
}
