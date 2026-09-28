/**
 * Upserts data/imported/*.json (produced by `npm run import:excel`) into
 * Supabase. Idempotent on id — safe to re-run after every re-import to keep
 * Supabase in sync with refreshed spreadsheets.
 *
 *   npx tsx scripts/seed-supabase.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local. Run supabase/schema.sql and
 * supabase/migrations/0002_auth_and_workflow.sql in the Supabase SQL Editor
 * first — this script only writes rows, it does not create tables.
 */
import * as dotenv from "dotenv";
import * as path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";
import departments from "../data/imported/departments.json";
import programs from "../data/imported/programs.json";
import faculty from "../data/imported/faculty.json";
import facultyResearch from "../data/imported/facultyResearch.json";
import facultyProjects from "../data/imported/facultyProjects.json";
import facultyTargets from "../data/imported/facultyTargets.json";
import facultyTargetSummaries from "../data/imported/facultyTargetSummaries.json";
import infrastructure from "../data/imported/infrastructure.json";
import hodSubmissions from "../data/imported/hodSubmissions.json";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: unknown[], onConflict = "id") {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + chunkSize), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  console.log("Seeding Supabase from data/imported/*.json ...");

  await upsert(
    "departments",
    (departments as any[]).map((d) => ({
      id: d.id,
      faculty_of_engineering: d.facultyOfEngineering,
      name: d.name,
      short_name: d.shortName,
      dean_name: d.deanName,
      hod_name: d.hodName,
      hod_contact: d.hodContact,
      reporting_period: d.reportingPeriod,
      date_of_submission: d.dateOfSubmission,
      name_from_filename: d.nameFromFilename ?? false,
    }))
  );

  await upsert(
    "programs",
    (programs as any[]).map((p) => ({
      id: p.id,
      dept_id: p.deptId,
      s_no: p.sNo,
      name: p.name,
      year_of_commencement: p.yearOfCommencement,
      mode_of_programme: p.modeOfProgramme,
      sanctioned_professor: p.sanctionedFacultyPositions?.professor,
      sanctioned_associate_professor: p.sanctionedFacultyPositions?.associateProfessor,
      sanctioned_assistant_professor: p.sanctionedFacultyPositions?.assistantProfessor,
      semester_fee_2024: p.semesterFeeByYear?.y2024,
      semester_fee_2025: p.semesterFeeByYear?.y2025,
      semester_fee_2026: p.semesterFeeByYear?.y2026,
      sanctioned_intake_2024: p.sanctionedIntakeByYear?.y2024,
      sanctioned_intake_2025: p.sanctionedIntakeByYear?.y2025,
      sanctioned_intake_2026: p.sanctionedIntakeByYear?.y2026,
      admitted_2024: p.admittedByYear?.y2024,
      admitted_2025: p.admittedByYear?.y2025,
      admitted_2026: p.admittedByYear?.y2026,
      nep_aligned: p.nepAligned,
      multiple_entry_exit: p.multipleEntryExit,
      internship_end_of_year: p.internshipEndOfYear,
      minor_specialisation_available: p.minorSpecialisationAvailable,
      remarks: p.remarks,
    }))
  );

  await upsert(
    "faculty",
    (faculty as any[]).map((f) => ({
      id: f.id,
      dept_id: f.primaryDepartment,
      s_no: f.sNo,
      name: f.name,
      designation: f.designation,
      appointment_type: f.appointmentType,
      date_of_joining: f.dateOfJoining,
      has_phd: f.hasPhd,
      programmes_appointed_for: f.programmesAppointedFor,
      teaching_load_hrs_per_week: f.teachingLoadHrsPerWeek,
      additional_responsibility: f.additionalResponsibility,
    }))
  );

  const facultyDeptRows = (faculty as any[]).flatMap((f) =>
    (f.departments as string[]).map((dept_id) => ({ faculty_id: f.id, dept_id }))
  );
  await upsert("faculty_departments", facultyDeptRows, "faculty_id,dept_id");

  await upsert(
    "faculty_research",
    (facultyResearch as any[]).map((r) => ({
      id: r.id,
      faculty_id: r.facultyId,
      journal_sci_scie_ssci: r.journalPublications?.sciScieSsci,
      journal_scopus_ugc_care: r.journalPublications?.scopusUgcCare,
      journal_other: r.journalPublications?.other,
      conference_international: r.conferencePublications?.international,
      conference_national: r.conferencePublications?.national,
      h_index: r.hIndex,
      i10_index: r.i10Index,
      google_scholar_orcid_link: r.googleScholarOrcidLink,
      patents_filed: r.patents?.filed,
      patents_published: r.patents?.published,
      patents_granted: r.patents?.granted,
      phd_registered: r.phdSupervision?.registered,
      phd_awarded: r.phdSupervision?.awarded,
    })),
    "faculty_id"
  );

  await upsert(
    "faculty_projects",
    (facultyProjects as any[]).map((p) => ({
      id: p.id,
      faculty_id: p.facultyId,
      sponsoring_agency: p.sponsoringAgency,
      year_of_grant: p.yearOfGrant,
      duration: p.duration,
      sanctioned_amount: p.sanctionedAmount,
      amount_released: p.amountReleased,
      current_status: p.currentStatus,
    }))
  );

  // A handful of target-sheet rows never matched a faculty record during
  // import (importer named them "<dept>-unmatched-N") — nothing to attach
  // them to in a relational schema, so they're skipped here.
  const knownFacultyIds = new Set((faculty as any[]).map((f) => f.id));
  const unmatchedTargets = (facultyTargets as any[]).filter((t) => !knownFacultyIds.has(t.facultyId));
  if (unmatchedTargets.length) {
    console.log(`  faculty_targets: skipping ${unmatchedTargets.length} unmatched row(s): ${unmatchedTargets.map((t) => t.facultyId).join(", ")}`);
  }
  await upsert(
    "faculty_targets",
    (facultyTargets as any[])
      .filter((t) => knownFacultyIds.has(t.facultyId))
      .map((t) => ({
      id: t.id,
      faculty_id: t.facultyId,
      s_no: t.sNo,
      designation: t.designation,
      nature_of_appointment: t.natureOfAppointment,
      date_of_joining: t.dateOfJoining,
      review_period: t.reviewPeriod,
      sci_scie_ssci_journal_papers: t.sciSciESsciJournalPapers,
      scopus_ugc_care_journal_papers: t.scopusUgcCareJournalPapers,
      q1q2_journal_papers_subset: t.q1q2JournalPapersSubset,
      international_conference_papers: t.internationalConferencePapers,
      national_conference_papers: t.nationalConferencePapers,
      govt_sponsored_project_proposals: t.govtSponsoredProjectProposals,
      industry_project_proposals: t.industryProjectProposals,
      target_funding_lakh: t.targetFundingLakh,
      funding_agencies_targeted: t.fundingAgenciesTargeted,
      tentative_project_theme_title: t.tentativeProjectThemeTitle,
      target_submission_month: t.targetSubmissionMonth,
      consultancy_industry_assignment_proposals: t.consultancyIndustryAssignmentProposals,
      patents_to_be_filed: t.patentsToBeFiled,
      patents_expected_published: t.patentsExpectedPublished,
      patents_expected_granted: t.patentsExpectedGranted,
      prototype_product_technology_proposed: t.prototypeProductTechnologyProposed,
      new_revised_course_syllabus_or_lab: t.newRevisedCourseSyllabusOrLab,
      e_content_mooc_innovative_teaching: t.eContentMoocInnovativeTeaching,
      student_mentoring_hackathon_internship_placement: t.studentMentoringHackathonInternshipPlacement,
      contribution_to_dept_development: t.contributionToDeptDevelopment,
      contribution_to_university_development: t.contributionToUniversityDevelopment,
      expected_measurable_outcome_by_june_2027: t.expectedMeasurableOutcomeByJune2027,
      q1_plan: t.q1Plan,
      q2_plan: t.q2Plan,
      q3_plan: t.q3Plan,
      q4_plan: t.q4Plan,
      q1_status: t.q1Status,
      q2_status: t.q2Status,
      q3_status: t.q3Status,
      q4_status: t.q4Status,
      milestone_achievement_pct: t.milestoneAchievementPct,
      hod_priority: t.hodPriority,
      hod_remarks_support_required: t.hodRemarksSupportRequired,
      year_end_achievement_summary: t.yearEndAchievementSummary,
    })),
    "faculty_id"
  );

  await upsert(
    "faculty_target_summaries",
    (facultyTargetSummaries as any[]).map((s) => ({
      dept_id: s.deptId,
      review_period: s.reviewPeriod,
      total_faculty_planned: s.totalFacultyPlanned,
      journal_publication_target: s.journalPublicationTarget,
      conference_paper_target: s.conferencePaperTarget,
      sponsored_industry_proposals_target: s.sponsoredIndustryProposalsTarget,
      target_funding_lakh: s.targetFundingLakh,
      patent_filing_target: s.patentFilingTarget,
      avg_milestone_achievement: s.avgMilestoneAchievement,
    })),
    "dept_id"
  );

  await upsert(
    "infrastructure",
    (infrastructure as any[]).map((i) => ({
      id: i.id,
      dept_id: i.deptId,
      s_no: i.sNo,
      lab_classroom_name: i.labClassroomName,
      floor_room_no: i.floorRoomNo,
      hours_allotted_per_week: i.hoursAllottedPerWeek,
      current_weekly_working_hours: i.currentWeeklyWorkingHours,
      lab_room_in_charge: i.labRoomInCharge,
      lab_assistant_support_staff: i.labAssistantSupportStaff,
      student_capacity: i.studentCapacity,
      major_equipment_available: i.majorEquipmentAvailable,
      programmes_using_facility: i.programmesUsingFacility,
      utilisation_pct: i.utilisationPct,
      digital_smart_board: i.digitalSmartBoard,
      projector: i.projector,
    }))
  );

  await upsert(
    "hod_submissions",
    (hodSubmissions as any[]).map((h) => ({
      dept_id: h.deptId,
      mobile_contact: h.mobileContact,
      date_of_submission: h.dateOfSubmission,
      snapshot_no_of_programmes: h.snapshot?.noOfProgrammes,
      snapshot_total_faculty_reported: h.snapshot?.totalFacultyReported,
      snapshot_total_sanctioned_intake_2026: h.snapshot?.totalSanctionedIntake2026,
      snapshot_faculty_with_phd: h.snapshot?.facultyWithPhd,
      snapshot_total_students_admitted_2026: h.snapshot?.totalStudentsAdmitted2026,
      snapshot_labs_classrooms_reported: h.snapshot?.labsClassroomsReported,
      snapshot_programmes_with_nep_alignment: h.snapshot?.programmesWithNepAlignment,
      snapshot_digital_smart_board_available: h.snapshot?.digitalSmartBoardAvailable,
      snapshot_projector_available: h.snapshot?.projectorAvailable,
      certification_signed_by: h.certificationSignedBy,
      certification_date: h.certificationDate,
      status: h.status ?? "Pending",
    })),
    "dept_id"
  );

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
