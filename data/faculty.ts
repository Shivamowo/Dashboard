import type {
  Faculty,
  FacultyProject,
  FacultyResearch,
  FacultyTarget,
  QuarterStatus,
  HodPriority,
} from "./types";
import { makeRng, hashString, int, pick, chance } from "./rng";
import { programsByDept } from "./programs";
import { globalSingleton } from "./globalStore";
import { imported, usingImportedData } from "./source";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NameSeed = {
  name: string;
  designation: Faculty["designation"];
  appointmentType: Faculty["appointmentType"];
  doj: string;
  phd: boolean;
};

const nameSeeds: Record<string, NameSeed[]> = {
  cse: [
    { name: "Dr. Divyendu Kr. Mishra", designation: "Professor", appointmentType: "Regular", doj: "24/08/2001", phd: true },
    { name: "Dr. Sunil Yadav", designation: "Associate Professor", appointmentType: "Regular", doj: "18/08/2008", phd: true },
    { name: "Dr. Prashant Kr. Yadav", designation: "Associate Professor", appointmentType: "Regular", doj: "16/07/2013", phd: true },
    { name: "Mr. Ravikant Yadav", designation: "Assistant Professor", appointmentType: "Contractual", doj: "13/08/2018", phd: false },
    { name: "Mr. Pravin Kr. Pandey", designation: "Assistant Professor", appointmentType: "Contractual", doj: "14/08/2018", phd: false },
    { name: "Ms. Deepti Pandey", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "14/09/2015", phd: true },
    { name: "Mr. Krishna Kr. Yadav", designation: "Assistant Professor", appointmentType: "Contractual", doj: "13/08/2018", phd: false },
    { name: "Mr. Purnendra Kumar", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "15/10/2014", phd: false },
    { name: "Dr. Anjali Srivastava", designation: "Assistant Professor", appointmentType: "Regular", doj: "02/02/2019", phd: true },
    { name: "Mr. Dileep Kr. Yadav", designation: "Assistant Professor", appointmentType: "Contractual", doj: "20/08/2018", phd: false },
    { name: "Dr. Nidhi Chaurasia", designation: "Assistant Professor", appointmentType: "Regular", doj: "11/01/2021", phd: true },
    { name: "Mr. Abhishek Maurya", designation: "Guest Faculty", appointmentType: "Guest", doj: "01/08/2024", phd: false },
  ],
  it: [
    { name: "Dr. Santosh Kr. Yadav", designation: "Professor", appointmentType: "Regular", doj: "12/09/2003", phd: true },
    { name: "Mr. Ashok Kr. Yadav", designation: "Associate Professor", appointmentType: "Regular", doj: "05/07/2009", phd: true },
    { name: "Mr. Ritesh Kr. Srivastav", designation: "Assistant Professor", appointmentType: "Contractual", doj: "19/08/2016", phd: false },
    { name: "Mr. Manoj Kr. Yadav", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "20/08/2018", phd: false },
    { name: "Dr. Shalini Verma", designation: "Assistant Professor", appointmentType: "Regular", doj: "04/03/2017", phd: true },
    { name: "Dr. Rakesh Ranjan Singh", designation: "Associate Professor", appointmentType: "Regular", doj: "26/11/2010", phd: true },
    { name: "Ms. Priyanka Gupta", designation: "Assistant Professor", appointmentType: "Contractual", doj: "07/09/2019", phd: false },
    { name: "Mr. Vivek Kr. Singh", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "16/07/2015", phd: false },
    { name: "Dr. Mohd. Aftab Alam", designation: "Assistant Professor", appointmentType: "Regular", doj: "21/06/2020", phd: true },
    { name: "Ms. Sneha Tiwari", designation: "Guest Faculty", appointmentType: "Guest", doj: "05/08/2025", phd: false },
  ],
  ece: [
    { name: "Dr. Alok Kr. Dubey", designation: "Professor", appointmentType: "Regular", doj: "15/12/2005", phd: true },
    { name: "Dr. Bhanu Pratap Yadav", designation: "Professor", appointmentType: "Regular", doj: "08/10/2002", phd: true },
    { name: "Dr. Sarika Singh", designation: "Associate Professor", appointmentType: "Regular", doj: "23/07/2011", phd: true },
    { name: "Mr. Rahul Kr. Gupta", designation: "Assistant Professor", appointmentType: "Contractual", doj: "01/08/2017", phd: false },
    { name: "Dr. Neelam Rai", designation: "Assistant Professor", appointmentType: "Regular", doj: "12/02/2018", phd: true },
    { name: "Mr. Sandeep Kr. Maurya", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "09/09/2016", phd: false },
    { name: "Mr. Amit Kr. Sharma", designation: "Assistant Professor", appointmentType: "Contractual", doj: "22/08/2019", phd: false },
    { name: "Dr. Poonam Jaiswal", designation: "Associate Professor", appointmentType: "Regular", doj: "17/05/2012", phd: true },
    { name: "Mr. Gaurav Pandey", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "03/07/2021", phd: false },
    { name: "Dr. Rajeev Kr. Chauhan", designation: "Assistant Professor", appointmentType: "Regular", doj: "28/01/2022", phd: true },
    { name: "Ms. Kavita Bind", designation: "Guest Faculty", appointmentType: "Guest", doj: "12/08/2024", phd: false },
  ],
  me: [
    { name: "Dr. Gyanendra Kr. Pal", designation: "Professor", appointmentType: "Regular", doj: "03/09/1999", phd: true },
    { name: "Dr. Brijesh Kr. Singh", designation: "Professor", appointmentType: "Regular", doj: "14/11/2004", phd: true },
    { name: "Dr. Umesh Chandra Yadav", designation: "Associate Professor", appointmentType: "Regular", doj: "27/06/2010", phd: true },
    { name: "Mr. Shailendra Kr. Vishwakarma", designation: "Assistant Professor", appointmentType: "Contractual", doj: "18/07/2016", phd: false },
    { name: "Dr. Anand Mohan Tiwari", designation: "Associate Professor", appointmentType: "Regular", doj: "09/03/2013", phd: true },
    { name: "Mr. Suresh Chandra Prajapati", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "02/08/2015", phd: false },
    { name: "Mr. Ajay Kr. Saroj", designation: "Assistant Professor", appointmentType: "Contractual", doj: "25/09/2018", phd: false },
    { name: "Dr. Richa Mishra", designation: "Assistant Professor", appointmentType: "Regular", doj: "06/01/2020", phd: true },
    { name: "Mr. Nitesh Kr. Patel", designation: "Assistant Professor", appointmentType: "Self-Financing", doj: "13/08/2019", phd: false },
    { name: "Mr. Hariom Shukla", designation: "Assistant Professor", appointmentType: "Contractual", doj: "11/07/2022", phd: false },
    { name: "Dr. Swati Agrahari", designation: "Assistant Professor", appointmentType: "Regular", doj: "19/02/2023", phd: true },
    { name: "Mr. Ram Naresh Yadav", designation: "Guest Faculty", appointmentType: "Guest", doj: "01/09/2025", phd: false },
  ],
};

const responsibilities = [
  "Departmental Time-Table In-charge",
  "Training & Placement Coordinator",
  "NBA / NAAC Coordinator",
  "Examination Coordinator",
  "Laboratory In-charge",
  "Student Mentoring & Anti-Ragging Cell",
  "Library & Purchase Committee Member",
  "Startup / Innovation Cell Coordinator",
  "Departmental Website & Data Cell",
  "NA",
];

const agencies = [
  "AICTE (ATAL / MODROB)",
  "DST-SERB",
  "UP Council of Science & Technology",
  "UGC",
  "MeitY",
  "DRDO",
  "Ministry of Education (IIC)",
  "BSNL R&D",
  "ICSSR",
];

const themes: Record<string, string[]> = {
  cse: [
    "Federated learning for privacy-preserving healthcare analytics",
    "Explainable AI for agricultural yield prediction in the Purvanchal region",
    "Lightweight intrusion detection for IoT edge gateways",
    "Knowledge-graph based question answering for regional languages",
    "GPU-accelerated graph analytics for smart-city traffic data",
  ],
  it: [
    "Blockchain-backed academic credential verification framework",
    "Zero-trust architecture for campus network segmentation",
    "Cloud-native micro-service observability toolkit",
    "Low-bandwidth telemedicine platform for rural health centres",
    "Adversarial robustness testing for phishing detection models",
  ],
  ece: [
    "Reconfigurable intelligent surfaces for 6G indoor coverage",
    "Low-power SRAM cell design in 28 nm CMOS",
    "UAV-assisted wireless sensor network for flood monitoring",
    "Millimetre-wave antenna array for automotive radar",
    "Energy-harvesting RF front-end for wearable biosensors",
  ],
  me: [
    "Additive manufacturing of functionally graded turbine blades",
    "Solar-biomass hybrid dryer for agro-produce preservation",
    "Tribological study of bio-lubricants for IC engine components",
    "Vibration-based condition monitoring of rotating machinery",
    "Design optimisation of micro-channel heat sinks",
  ],
};

const prototypes = [
  "Working prototype demonstrated at the university tech-expo",
  "Proof-of-concept software module with source repository",
  "Bench-scale hardware prototype with test report",
  "Technology readiness level 4 demonstrator",
  "NA",
];

const months = ["September 2026", "November 2026", "January 2027", "March 2027", "May 2027"];

function buildAll() {
  const facultyRows: Faculty[] = [];
  const researchRows: FacultyResearch[] = [];
  const projectRows: FacultyProject[] = [];
  const targetRows: FacultyTarget[] = [];

  for (const [deptId, seeds] of Object.entries(nameSeeds)) {
    const progNames = programsByDept(deptId).map((p) => p.name);

    seeds.forEach((s, i) => {
      const fid = deptId + "-f" + (i + 1);
      const r = makeRng(hashString(fid + "-core"));
      const senior = s.designation === "Professor";
      const mid = s.designation === "Associate Professor";
      const guest = s.designation === "Guest Faculty";
      const weight = senior ? 3 : mid ? 2 : guest ? 0.4 : 1;

      const assigned = [progNames[i % progNames.length], progNames[(i + 2) % progNames.length]]
        .filter(Boolean)
        .filter((v, k, a) => a.indexOf(v) === k)
        .join(", ");

      facultyRows.push({
        id: fid,
        departments: [deptId],
        primaryDepartment: deptId,
        sNo: i + 1,
        name: s.name,
        designation: s.designation,
        appointmentType: s.appointmentType,
        dateOfJoining: s.doj,
        hasPhd: s.phd,
        programmesAppointedFor: assigned,
        teachingLoadHrsPerWeek: senior ? int(r, 8, 12) : mid ? int(r, 12, 16) : int(r, 14, 22),
        additionalResponsibility: pick(r, responsibilities),
      });

      // ---------- research ----------
      const rr = makeRng(hashString(fid + "-res"));
      const sci = Math.round(int(rr, 0, 9) * weight * 0.8);
      const scopus = Math.round(int(rr, 2, 16) * weight * 0.7);
      const other = int(rr, 0, 7);
      const intl = Math.round(int(rr, 1, 10) * weight * 0.6);
      const natl = int(rr, 0, 9);
      const years = [2022, 2023, 2024, 2025, 2026];

      const split = (total: number, key: string) => {
        const rs = makeRng(hashString(fid + key));
        const w = years.map(() => 0.5 + rs());
        const sum = w.reduce((a, b) => a + b, 0);
        const parts = w.map((x) => Math.floor((x / sum) * total));
        let rem = total - parts.reduce((a, b) => a + b, 0);
        let k = 0;
        while (rem > 0) {
          parts[k % years.length]++;
          k++;
          rem--;
        }
        return parts;
      };
      const jParts = split(sci + scopus + other, "-jy");
      const cParts = split(intl + natl, "-cy");

      researchRows.push({
        id: fid + "-res",
        facultyId: fid,
        journalPublications: { sciScieSsci: sci, scopusUgcCare: scopus, other },
        conferencePublications: { international: intl, national: natl },
        hIndex: s.phd ? int(rr, 2, senior ? 21 : mid ? 14 : 9) : int(rr, 0, 4),
        i10Index: s.phd ? int(rr, 1, senior ? 28 : mid ? 16 : 8) : int(rr, 0, 3),
        googleScholarOrcidLink:
          "https://scholar.google.com/citations?user=" +
          deptId.toUpperCase() +
          (1000 + i * 37) +
          "QAAAAJ&hl=en",
        patents: {
          filed: Math.round(int(rr, 0, 4) * weight * 0.6),
          published: chance(rr, 0.45) ? int(rr, 0, 2) : 0,
          granted: chance(rr, 0.2) ? int(rr, 0, 1) : 0,
        },
        phdSupervision: {
          registered: s.phd ? (senior ? int(rr, 3, 8) : mid ? int(rr, 1, 5) : int(rr, 0, 3)) : 0,
          awarded: s.phd ? (senior ? int(rr, 1, 6) : mid ? int(rr, 0, 3) : 0) : 0,
        },
        yearly: years.map((y, k) => ({ year: y, journal: jParts[k], conference: cParts[k] })),
      });

      // ---------- sponsored projects (0-2) ----------
      const pr = makeRng(hashString(fid + "-proj"));
      const nProjects = s.phd
        ? senior
          ? 2
          : chance(pr, 0.7)
          ? int(pr, 1, 2)
          : 0
        : chance(pr, 0.35)
        ? 1
        : 0;

      const statusOptions: FacultyProject["currentStatus"][] = [
        "Ongoing",
        "Completed",
        "Submitted",
        "Sanctioned",
        "Closed",
      ];

      for (let k = 0; k < nProjects; k++) {
        const sanctioned = int(pr, 3, 48) * 100000;
        const status = pick(pr, statusOptions);
        const releasedPct =
          status === "Completed" || status === "Closed"
            ? 1
            : status === "Submitted"
            ? 0
            : 0.3 + pr() * 0.6;
        projectRows.push({
          id: fid + "-pr" + (k + 1),
          facultyId: fid,
          sponsoringAgency: pick(pr, agencies),
          yearOfGrant: int(pr, 2019, 2026),
          duration: pick(pr, ["1 year", "18 months", "2 years", "3 years"]),
          sanctionedAmount: sanctioned,
          amountReleased: Math.round((sanctioned * releasedPct) / 10000) * 10000,
          currentStatus: status,
        });
      }

      // ---------- annual targets ----------
      const tr = makeRng(hashString(fid + "-tgt"));
      const theme = themes[deptId][i % themes[deptId].length];
      const pct = int(tr, 18, 98);
      const priority: HodPriority = pct >= 70 ? "High" : pct >= 45 ? "Medium" : "Low";
      const qStatus = (base: number): QuarterStatus =>
        pct >= 85
          ? base > 0.4
            ? "Completed"
            : "On track"
          : pct >= 60
          ? base > 0.3
            ? "On track"
            : "At risk"
          : pct >= 40
          ? base > 0.5
            ? "At risk"
            : "Delayed"
          : base > 0.75
          ? "At risk"
          : "Delayed";

      targetRows.push({
        id: fid + "-tgt",
        facultyId: fid,
        sNo: i + 1,
        designation: s.designation,
        natureOfAppointment: s.appointmentType,
        dateOfJoining: s.doj,
        reviewPeriod: "July 2026 - June 2027",
        sciSciESsciJournalPapers: Math.max(0, Math.round(int(tr, 0, 4) * weight * 0.7)),
        scopusUgcCareJournalPapers: Math.max(1, Math.round(int(tr, 1, 6) * weight * 0.6)),
        q1q2JournalPapersSubset: int(tr, 0, 3),
        internationalConferencePapers: int(tr, 0, 4),
        nationalConferencePapers: int(tr, 0, 3),
        govtSponsoredProjectProposals: int(tr, 0, 3),
        industryProjectProposals: int(tr, 0, 2),
        targetFundingLakh: int(tr, 2, 60),
        fundingAgenciesTargeted: [pick(tr, agencies), pick(tr, agencies)]
          .filter((v, k, a) => a.indexOf(v) === k)
          .join(", "),
        tentativeProjectThemeTitle: theme,
        targetSubmissionMonth: pick(tr, months),
        consultancyIndustryAssignmentProposals: int(tr, 0, 2),
        patentsToBeFiled: int(tr, 0, 3),
        patentsExpectedPublished: int(tr, 0, 2),
        patentsExpectedGranted: int(tr, 0, 1),
        prototypeProductTechnologyProposed: pick(tr, prototypes),
        newRevisedCourseSyllabusOrLab: pick(tr, [
          "Revision of 5th semester elective syllabus as per the NEP credit framework",
          "Development of a new advanced laboratory manual with 10 experiments",
          "Introduction of a 30-hour value-added certificate course",
          "Restructuring of the practical assessment rubric",
          "NA",
        ]),
        eContentMoocInnovativeTeaching: pick(tr, [
          "Two NPTEL-style video modules to be recorded",
          "SWAYAM course content contribution (4 weeks)",
          "Flipped-classroom pilot in one core course",
          "Open e-content repository on the department portal",
          "NA",
        ]),
        studentMentoringHackathonInternshipPlacement: pick(tr, [
          "Mentor 2 teams for Smart India Hackathon 2026",
          "Facilitate 15 summer internships through industry contacts",
          "Run a weekly placement preparation clinic",
          "Guide 3 student research groups towards conference papers",
          "Mentor NSS / innovation club activities",
        ]),
        contributionToDeptDevelopment: pick(tr, [
          "Set up a dedicated research laboratory with sponsored funds",
          "Establish an MoU with one industry partner",
          "Automate departmental attendance and result analysis",
          "Lead NBA documentation for the programme",
          "Organise one national-level faculty development programme",
        ]),
        contributionToUniversityDevelopment: pick(tr, [
          "Contribute to the university-wide LMS rollout",
          "Member of the university IQAC data verification team",
          "Coordinate the inter-department research colloquium",
          "Support university ranking data compilation (NIRF)",
          "Assist in university startup incubation activities",
        ]),
        expectedMeasurableOutcomeByJune2027: pick(tr, [
          "Minimum 3 indexed publications and 1 project proposal submitted",
          "One patent filed and one funded project sanctioned",
          "Two SCI papers, one MoU signed and a lab commissioned",
          "One MOOC module published and 20 students placed",
          "Two conference papers and one consultancy assignment",
        ]),
        q1Plan: "Literature survey completed and target journals shortlisted",
        q2Plan: "First manuscript drafted; project proposal submitted to agency",
        q3Plan: "Revision / resubmission and prototype development started",
        q4Plan: "Publication acceptance, patent filing and year-end reporting",
        q1Status: qStatus(tr()),
        q2Status: qStatus(tr()),
        q3Status: qStatus(tr()),
        q4Status: qStatus(tr()),
        milestoneAchievementPct: pct,
        hodPriority: priority,
        hodRemarksSupportRequired: pick(tr, [
          "Requires seed grant support and a lab consumables budget",
          "Needs reduction of one theory course to protect research time",
          "Progress satisfactory; continue as planned",
          "Support required for APC / publication charges",
          "Needs a research assistant for data collection",
          "Follow-up review scheduled in the next departmental meeting",
        ]),
        yearEndAchievementSummary:
          pct >= 85
            ? "All committed milestones met ahead of the review window."
            : pct >= 60
            ? "Majority of milestones met; residual items carried to the next quarter."
            : pct >= 40
            ? "Partial achievement; publication targets lagging behind plan."
            : "Significant shortfall against plan; corrective action agreed with the HoD.",
      });
    });
  }

  return { facultyRows, researchRows, projectRows, targetRows };
}

const built = globalSingleton("faculty:built", () =>
  usingImportedData
    ? {
        facultyRows: imported.faculty,
        researchRows: imported.facultyResearch,
        projectRows: imported.facultyProjects,
        targetRows: imported.facultyTargets,
      }
    : buildAll()
);

export const faculty: Faculty[] = built.facultyRows;
export const facultyResearch: FacultyResearch[] = built.researchRows;
export const facultyProjects: FacultyProject[] = built.projectRows;
export const facultyTargets: FacultyTarget[] = built.targetRows;

/**
 * Faculty serving a department, INCLUDING people shared with other departments.
 * A shared person appears in full in every department they serve, so summing
 * per-department counts exceeds the distinct university total — intended.
 */
export const facultyByDept = (deptId: string) =>
  faculty.filter((f) => f.departments.includes(deptId));
export const facultyById = (id: string) => faculty.find((f) => f.id === id);
export const researchOf = (facultyId: string) =>
  facultyResearch.find((x) => x.facultyId === facultyId);
export const projectsOf = (facultyId: string) =>
  facultyProjects.filter((x) => x.facultyId === facultyId);
export const targetOf = (facultyId: string) =>
  facultyTargets.find((x) => x.facultyId === facultyId);

/* --------------------------------------------------------------------------
 * Mutation helpers for the edit/approval workflow (data/store.ts) and Admin's
 * direct-write access. These mutate the in-memory arrays above in place —
 * see data/store.ts for why that is fine in the current phase.
 * ------------------------------------------------------------------------ */

export type FacultyProfileEdit = Omit<Faculty, "id" | "departments" | "primaryDepartment" | "sNo">;
export type FacultyResearchEdit = Omit<FacultyResearch, "id" | "facultyId" | "yearly">;
export type FacultyTargetEdit = Omit<FacultyTarget, "id" | "facultyId" | "sNo">;
export type FacultyProjectEdit = Omit<FacultyProject, "id" | "facultyId">;

/**
 * Every function below updates the in-memory arrays immediately (so the
 * current request's revalidatePath/redirect shows fresh data even if the
 * network write below is still in flight) and, when Supabase is configured,
 * persists to Supabase too — the durable copy that instrumentation.ts reloads
 * on the next server boot. Supabase writes use the service-role client and
 * bypass RLS, matching "writes go to Supabase only, not the JSON snapshot".
 */

const facultyRow = (f: { id: string; primaryDepartment: string } & FacultyProfileEdit) => ({
  id: f.id,
  dept_id: f.primaryDepartment,
  s_no: (facultyById(f.id)?.sNo) ?? 0,
  name: f.name,
  designation: f.designation,
  appointment_type: f.appointmentType,
  date_of_joining: f.dateOfJoining,
  has_phd: f.hasPhd,
  programmes_appointed_for: f.programmesAppointedFor,
  teaching_load_hrs_per_week: f.teachingLoadHrsPerWeek,
  additional_responsibility: f.additionalResponsibility,
});

/** Onboarding / Admin "Add Faculty": creates the Faculty record and returns its new id. */
export async function addFacultyRecord(deptIds: string | string[], data: FacultyProfileEdit): Promise<string> {
  const departments = Array.isArray(deptIds) ? deptIds : [deptIds];
  const primaryDepartment = departments[0];
  const id = primaryDepartment + "-f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const sNo = facultyByDept(primaryDepartment).length + 1;
  faculty.push({ id, departments, primaryDepartment, sNo, ...data });

  if (isSupabaseConfigured) {
    const db = createSupabaseAdminClient();
    const { error } = await db.from("faculty").insert({ ...facultyRow({ id, primaryDepartment, ...data }), s_no: sNo });
    if (error) throw error;
    const { error: joinError } = await db
      .from("faculty_departments")
      .insert(departments.map((dept_id) => ({ faculty_id: id, dept_id })));
    if (joinError) throw joinError;
  }
  return id;
}

export async function removeFacultyRecord(id: string): Promise<boolean> {
  const i = faculty.findIndex((f) => f.id === id);
  if (i < 0) return false;
  faculty.splice(i, 1);
  if (isSupabaseConfigured) {
    const { error } = await createSupabaseAdminClient().from("faculty").delete().eq("id", id);
    if (error) throw error;
  }
  return true;
}

export async function updateFacultyRecord(id: string, data: FacultyProfileEdit) {
  const f = facultyById(id);
  if (!f) return;
  Object.assign(f, data);
  if (isSupabaseConfigured) {
    const { error } = await createSupabaseAdminClient()
      .from("faculty")
      .update(facultyRow({ id, primaryDepartment: f.primaryDepartment, ...data }))
      .eq("id", id);
    if (error) throw error;
  }
}

export async function setFacultyResearch(facultyId: string, data: FacultyResearchEdit) {
  const idx = facultyResearch.findIndex((r) => r.facultyId === facultyId);
  if (idx >= 0) facultyResearch[idx] = { ...facultyResearch[idx], ...data };
  else facultyResearch.push({ id: facultyId + "-res", facultyId, yearly: [], ...data });

  if (isSupabaseConfigured) {
    const { error } = await createSupabaseAdminClient()
      .from("faculty_research")
      .upsert({
        id: facultyId + "-res",
        faculty_id: facultyId,
        journal_sci_scie_ssci: data.journalPublications.sciScieSsci,
        journal_scopus_ugc_care: data.journalPublications.scopusUgcCare,
        journal_other: data.journalPublications.other,
        conference_international: data.conferencePublications.international,
        conference_national: data.conferencePublications.national,
        h_index: data.hIndex,
        i10_index: data.i10Index,
        google_scholar_orcid_link: data.googleScholarOrcidLink,
        patents_filed: data.patents.filed,
        patents_published: data.patents.published,
        patents_granted: data.patents.granted,
        phd_registered: data.phdSupervision.registered,
        phd_awarded: data.phdSupervision.awarded,
      });
    if (error) throw error;
  }
}

export async function setFacultyTarget(facultyId: string, sNo: number, data: FacultyTargetEdit) {
  const idx = facultyTargets.findIndex((t) => t.facultyId === facultyId);
  const full: FacultyTarget = { id: facultyId + "-tgt", facultyId, sNo, ...data };
  if (idx >= 0) facultyTargets[idx] = full;
  else facultyTargets.push(full);

  if (isSupabaseConfigured) {
    const { error } = await createSupabaseAdminClient()
      .from("faculty_targets")
      .upsert({
        id: full.id,
        faculty_id: facultyId,
        s_no: sNo,
        designation: full.designation,
        nature_of_appointment: full.natureOfAppointment,
        date_of_joining: full.dateOfJoining,
        review_period: full.reviewPeriod,
        sci_scie_ssci_journal_papers: full.sciSciESsciJournalPapers,
        scopus_ugc_care_journal_papers: full.scopusUgcCareJournalPapers,
        q1q2_journal_papers_subset: full.q1q2JournalPapersSubset,
        international_conference_papers: full.internationalConferencePapers,
        national_conference_papers: full.nationalConferencePapers,
        govt_sponsored_project_proposals: full.govtSponsoredProjectProposals,
        industry_project_proposals: full.industryProjectProposals,
        target_funding_lakh: full.targetFundingLakh,
        funding_agencies_targeted: full.fundingAgenciesTargeted,
        tentative_project_theme_title: full.tentativeProjectThemeTitle,
        target_submission_month: full.targetSubmissionMonth,
        consultancy_industry_assignment_proposals: full.consultancyIndustryAssignmentProposals,
        patents_to_be_filed: full.patentsToBeFiled,
        patents_expected_published: full.patentsExpectedPublished,
        patents_expected_granted: full.patentsExpectedGranted,
        prototype_product_technology_proposed: full.prototypeProductTechnologyProposed,
        new_revised_course_syllabus_or_lab: full.newRevisedCourseSyllabusOrLab,
        e_content_mooc_innovative_teaching: full.eContentMoocInnovativeTeaching,
        student_mentoring_hackathon_internship_placement: full.studentMentoringHackathonInternshipPlacement,
        contribution_to_dept_development: full.contributionToDeptDevelopment,
        contribution_to_university_development: full.contributionToUniversityDevelopment,
        expected_measurable_outcome_by_june_2027: full.expectedMeasurableOutcomeByJune2027,
        q1_plan: full.q1Plan,
        q2_plan: full.q2Plan,
        q3_plan: full.q3Plan,
        q4_plan: full.q4Plan,
        q1_status: full.q1Status,
        q2_status: full.q2Status,
        q3_status: full.q3Status,
        q4_status: full.q4Status,
        milestone_achievement_pct: full.milestoneAchievementPct,
        hod_priority: full.hodPriority,
        hod_remarks_support_required: full.hodRemarksSupportRequired,
        year_end_achievement_summary: full.yearEndAchievementSummary,
      });
    if (error) throw error;
  }
}

export async function setFacultyProjects(facultyId: string, list: FacultyProjectEdit[]) {
  const others = facultyProjects.filter((p) => p.facultyId !== facultyId);
  const fresh: FacultyProject[] = list.map((p, i) => ({
    ...p,
    id: facultyId + "-pr" + (i + 1),
    facultyId,
  }));
  facultyProjects.length = 0;
  facultyProjects.push(...others, ...fresh);

  if (isSupabaseConfigured) {
    const db = createSupabaseAdminClient();
    const { error: delError } = await db.from("faculty_projects").delete().eq("faculty_id", facultyId);
    if (delError) throw delError;
    if (fresh.length) {
      const { error } = await db.from("faculty_projects").insert(
        fresh.map((p) => ({
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
      if (error) throw error;
    }
  }
}
