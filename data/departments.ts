import type { Department } from "./types";
import { globalSingleton } from "./globalStore";
import { chooseData, imported } from "./source";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const seedDepartments = (): Department[] => [
  {
    id: "cse",
    facultyOfEngineering: "Faculty of Engineering & Technology",
    name: "Computer Science & Engineering",
    shortName: "CSE",
    deanName: "Prof. R. K. Singh",
    hodName: "Dr. Divyendu Kr. Mishra",
    hodContact: "+91 94150 23781",
    reportingPeriod: "Academic Years 2023-24 to 2026-27",
    dateOfSubmission: "2026-07-18",
  },
  {
    id: "it",
    facultyOfEngineering: "Faculty of Engineering & Technology",
    name: "Information Technology",
    shortName: "IT",
    deanName: "Prof. R. K. Singh",
    hodName: "Dr. Santosh Kr. Yadav",
    hodContact: "+91 94520 11644",
    reportingPeriod: "Academic Years 2023-24 to 2026-27",
    dateOfSubmission: "2026-07-22",
  },
  {
    id: "ece",
    facultyOfEngineering: "Faculty of Engineering & Technology",
    name: "Electronics & Communication Engineering",
    shortName: "ECE",
    deanName: "Prof. R. K. Singh",
    hodName: "Dr. Prashant Kr. Yadav",
    hodContact: "+91 98390 47215",
    reportingPeriod: "Academic Years 2023-24 to 2026-27",
    dateOfSubmission: "2026-08-02",
  },
  {
    id: "me",
    facultyOfEngineering: "Faculty of Engineering & Technology",
    name: "Mechanical Engineering",
    shortName: "ME",
    deanName: "Prof. R. K. Singh",
    hodName: "Dr. Gyanendra Kr. Pal",
    hodContact: "+91 99350 76102",
    reportingPeriod: "Academic Years 2023-24 to 2026-27",
    dateOfSubmission: "2026-07-29",
  },
];

export const departments: Department[] = globalSingleton("departments", () =>
  chooseData(imported.departments, seedDepartments)
);

export const departmentById = (id: string) => departments.find((d) => d.id === id);

/** Applied on approval of a HoD edit/onboarding change request. */
export async function updateDepartmentHod(deptId: string, patch: { hodName?: string; hodContact?: string }) {
  const d = departmentById(deptId);
  if (!d) return;
  Object.assign(d, patch);
  if (isSupabaseConfigured) {
    const row: Record<string, string> = {};
    if (patch.hodName !== undefined) row.hod_name = patch.hodName;
    if (patch.hodContact !== undefined) row.hod_contact = patch.hodContact;
    if (Object.keys(row).length) {
      const { error } = await createSupabaseAdminClient().from("departments").update(row).eq("id", deptId);
      if (error) throw error;
    }
  }
}

export type DepartmentInfoPatch = Partial<
  Pick<Department, "facultyOfEngineering" | "deanName" | "hodName" | "hodContact" | "reportingPeriod" | "dateOfSubmission">
>;

/** Department header details from the HoD workbook. Blank -> null (never ""). */
export async function updateDepartmentInfo(deptId: string, patch: DepartmentInfoPatch) {
  const d = departmentById(deptId);
  if (!d) return;
  Object.assign(d, patch);
  if (isSupabaseConfigured) {
    const map: Record<keyof DepartmentInfoPatch, string> = {
      facultyOfEngineering: "faculty_of_engineering",
      deanName: "dean_name",
      hodName: "hod_name",
      hodContact: "hod_contact",
      reportingPeriod: "reporting_period",
      dateOfSubmission: "date_of_submission",
    };
    const row: Record<string, string | null> = {};
    for (const [k, col] of Object.entries(map)) {
      const v = patch[k as keyof DepartmentInfoPatch];
      if (v !== undefined) row[col] = v;
    }
    if (Object.keys(row).length) {
      const { error } = await createSupabaseAdminClient().from("departments").update(row).eq("id", deptId);
      if (error) throw error;
    }
  }
}
