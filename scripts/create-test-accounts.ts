/**
 * Creates 3 disposable demo/test accounts for an end-to-end walkthrough —
 * one VC, one Admin, one Faculty — plus a dummy Faculty record so the
 * faculty demo account has something populated to look at.
 *
 *   npx tsx scripts/create-test-accounts.ts
 *
 * Entirely separate from scripts/create-logins.ts and its email-assignments
 * mapping — these 3 rows are tagged with a "TEST DEMO — " display-name
 * prefix so they're unambiguous, and are Supabase-only: none of this touches
 * data/imported/*.json, so `npm run import:excel` never disturbs it.
 *
 * must_change_password is false for all three — the demo login must be
 * instant, no forced password change in the way.
 *
 * Teardown: scripts/remove-test-accounts.ts
 */
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const PASSWORD = "TestDemo@123";
const TEST_FACULTY_ID = "test-demo-faculty";
const TEST_DEPT_ID = "cse"; // has programmes + infrastructure already seeded, so the demo view isn't empty.

const ACCOUNTS = [
  { role: "vc", email: "demo-vc@vbspu.ac.in", name: "TEST DEMO — Vice Chancellor" },
  { role: "admin", email: "demo-admin@vbspu.ac.in", name: "TEST DEMO — Administrator" },
  { role: "faculty", email: "demo-faculty@vbspu.ac.in", name: "TEST DEMO — Faculty" },
] as const;

async function createDummyFacultyRecord() {
  const { error: facultyError } = await db.from("faculty").upsert({
    id: TEST_FACULTY_ID,
    dept_id: TEST_DEPT_ID,
    s_no: 9999,
    name: "TEST DEMO — Faculty",
    designation: "Assistant Professor",
    appointment_type: "Regular",
    date_of_joining: "2024-01-01",
    has_phd: true,
    programmes_appointed_for: "B.Tech CSE",
    teaching_load_hrs_per_week: 12,
    additional_responsibility: "NA",
  });
  if (facultyError) throw facultyError;

  const { error: deptLinkError } = await db
    .from("faculty_departments")
    .upsert({ faculty_id: TEST_FACULTY_ID, dept_id: TEST_DEPT_ID });
  if (deptLinkError) throw deptLinkError;

  const { error: researchError } = await db.from("faculty_research").upsert({
    id: TEST_FACULTY_ID + "-res",
    faculty_id: TEST_FACULTY_ID,
    journal_sci_scie_ssci: 4,
    journal_scopus_ugc_care: 6,
    journal_other: 2,
    conference_international: 3,
    conference_national: 5,
    h_index: 5,
    i10_index: 3,
    google_scholar_orcid_link: "https://scholar.google.com/citations?user=TESTDEMOQAAAAJ&hl=en",
    patents_filed: 1,
    patents_published: 1,
    patents_granted: 0,
    phd_registered: 2,
    phd_awarded: 1,
  });
  if (researchError) throw researchError;

  const { error: projectError } = await db.from("faculty_projects").upsert({
    id: TEST_FACULTY_ID + "-pr1",
    faculty_id: TEST_FACULTY_ID,
    sponsoring_agency: "DST-SERB",
    year_of_grant: 2025,
    duration: "2 years",
    sanctioned_amount: 1200000,
    amount_released: 600000,
    current_status: "Ongoing",
  });
  if (projectError) throw projectError;

  const { error: targetError } = await db.from("faculty_targets").upsert({
    id: TEST_FACULTY_ID + "-tgt",
    faculty_id: TEST_FACULTY_ID,
    s_no: 9999,
    designation: "Assistant Professor",
    nature_of_appointment: "Regular",
    date_of_joining: "2024-01-01",
    review_period: "July 2026 - June 2027",
    sci_scie_ssci_journal_papers: 3,
    scopus_ugc_care_journal_papers: 4,
    q1q2_journal_papers_subset: 2,
    international_conference_papers: 2,
    national_conference_papers: 2,
    govt_sponsored_project_proposals: 1,
    industry_project_proposals: 1,
    target_funding_lakh: 15,
    funding_agencies_targeted: "DST-SERB, AICTE",
    tentative_project_theme_title: "Demo project theme for walkthrough purposes",
    target_submission_month: "March 2027",
    consultancy_industry_assignment_proposals: 1,
    patents_to_be_filed: 1,
    patents_expected_published: 1,
    patents_expected_granted: 0,
    prototype_product_technology_proposed: "Working prototype demonstrated at the university tech-expo",
    new_revised_course_syllabus_or_lab: "Demo lab manual revision",
    e_content_mooc_innovative_teaching: "Demo e-content module",
    student_mentoring_hackathon_internship_placement: "Mentor 1 team for Smart India Hackathon",
    contribution_to_dept_development: "Demo departmental contribution",
    contribution_to_university_development: "Demo university-level contribution",
    expected_measurable_outcome_by_june_2027: "Two indexed publications and one project proposal submitted",
    q1_plan: "Demo Q1 plan",
    q2_plan: "Demo Q2 plan",
    q3_plan: "Demo Q3 plan",
    q4_plan: "Demo Q4 plan",
    q1_status: "On track",
    q2_status: "On track",
    q3_status: "At risk",
    q4_status: "On track",
    milestone_achievement_pct: 62,
    hod_priority: "Medium",
    hod_remarks_support_required: "Demo remarks",
    year_end_achievement_summary: "Majority of milestones met; residual items carried to the next quarter.",
  });
  if (targetError) throw targetError;

  console.log(`  faculty record ${TEST_FACULTY_ID} (dept ${TEST_DEPT_ID}) + research/projects/targets ready`);
}

async function main() {
  const lines: string[] = [];
  console.log("Creating 3 disposable demo/test accounts ...");

  // Must exist before the faculty profile row can reference it (FK).
  await createDummyFacultyRecord();

  for (const acc of ACCOUNTS) {
    const { data: existingList } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existing = existingList?.users.find((u) => u.email?.toLowerCase() === acc.email);

    let uid: string;
    if (existing) {
      const { error } = await db.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
      if (error) throw error;
      uid = existing.id;
      console.log(`  reset: ${acc.email}`);
    } else {
      const { data: created, error } = await db.auth.admin.createUser({
        email: acc.email,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      uid = created.user!.id;
      console.log(`  created: ${acc.email}`);
    }

    const { error: profileError } = await db.from("profiles").upsert({
      id: uid,
      role: acc.role,
      display_name: acc.name,
      status: "active",
      must_change_password: false,
      faculty_id: acc.role === "faculty" ? TEST_FACULTY_ID : null,
    });
    if (profileError) throw profileError;

    lines.push(`${acc.role}: ${acc.email} / ${PASSWORD}`);
  }

  const out = [
    "TEST/DEMO ACCOUNTS — disposable, delete with scripts/remove-test-accounts.ts",
    "Generated: " + new Date().toISOString(),
    "",
    ...lines,
    "",
  ].join("\n");
  const outPath = path.resolve(__dirname, "..", "test-accounts-credentials.txt");
  fs.writeFileSync(outPath, out, "utf-8");

  console.log("\n" + out);
  console.log(`Wrote ${outPath} (gitignored — do not commit).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
