import type {
  Department,
  DeptFacultyTargetSummary,
  Faculty,
  FacultyProject,
  FacultyResearch,
  FacultyTarget,
  HodSubmission,
  Infrastructure,
  Program,
} from "./types";

import { getSupabaseSnapshot } from "@/lib/supabase/snapshot";
import { isSupabaseConfigured as supabaseEnvConfigured } from "@/lib/supabase/config";

import importedDepartments from "./imported/departments.json";
import importedPrograms from "./imported/programs.json";
import importedFaculty from "./imported/faculty.json";
import importedFacultyResearch from "./imported/facultyResearch.json";
import importedFacultyProjects from "./imported/facultyProjects.json";
import importedInfrastructure from "./imported/infrastructure.json";
import importedHodSubmissions from "./imported/hodSubmissions.json";
import importedTargetSummaries from "./imported/facultyTargetSummaries.json";
import importedFacultyTargets from "./imported/facultyTargets.json";

/**
 * WHICH DATASET THE APP READS
 *
 * Default: the real department data imported from the workbooks in excel-data/
 * (see scripts/import-excel-data.ts, output in data/imported/).
 *
 * Set VBSPU_DATA_SOURCE=mock to fall back to the synthetic generator instead —
 * useful for a clean demo reset, or to exercise screens that the real data
 * leaves largely blank. The generator is still in data/*.ts and is not loaded
 * at all under the default, so the real data is what ships.
 *
 *     VBSPU_DATA_SOURCE=mock npm run dev
 *     npm run demo:mock
 *
 * Read at module load on the server; it is not a per-request switch.
 */
export const DATA_SOURCE: "imported" | "mock" =
  process.env.VBSPU_DATA_SOURCE === "mock" ? "mock" : "imported";

export const usingImportedData = DATA_SOURCE === "imported";

/**
 * The JSON is generated from the same TypeScript interfaces the app consumes,
 * but `resolveJsonModule` widens literal types (e.g. status: string), so each
 * dataset is asserted back to its declared shape on the way in.
 */
const jsonImported = {
  departments: importedDepartments as Department[],
  programs: importedPrograms as Program[],
  faculty: importedFaculty as Faculty[],
  facultyResearch: importedFacultyResearch as unknown as FacultyResearch[],
  facultyProjects: importedFacultyProjects as FacultyProject[],
  infrastructure: importedInfrastructure as Infrastructure[],
  hodSubmissions: importedHodSubmissions as unknown as HodSubmission[],
  facultyTargetSummaries: importedTargetSummaries as DeptFacultyTargetSummary[],
  facultyTargets: importedFacultyTargets as FacultyTarget[],
};

/** Supabase rows win over the Excel JSON on id match; JSON rows fill in the rest. */
function mergeById<T extends { id: string }>(jsonRows: T[], supabaseRows: T[] | undefined): T[] {
  if (!supabaseRows?.length) return jsonRows;
  const supabaseIds = new Set(supabaseRows.map((r) => r.id));
  return [...supabaseRows, ...jsonRows.filter((r) => !supabaseIds.has(r.id))];
}

function mergeByKey<T, K extends keyof T>(jsonRows: T[], supabaseRows: T[] | undefined, key: K): T[] {
  if (!supabaseRows?.length) return jsonRows;
  const supabaseKeys = new Set(supabaseRows.map((r) => r[key]));
  return [...supabaseRows, ...jsonRows.filter((r) => !supabaseKeys.has(r[key]))];
}

/**
 * data/source.ts is imported at module load by every data/*.ts module, well
 * after instrumentation.ts (see repo root) has warmed the Supabase snapshot —
 * so this merge runs once, with the snapshot already populated whenever
 * Supabase is configured. See lib/supabase/snapshot.ts.
 */
const supabaseSnapshot = supabaseEnvConfigured ? getSupabaseSnapshot() : null;

export const imported = {
  departments: mergeById(jsonImported.departments, supabaseSnapshot?.departments),
  programs: mergeById(jsonImported.programs, supabaseSnapshot?.programs),
  faculty: mergeById(jsonImported.faculty, supabaseSnapshot?.faculty),
  facultyResearch: mergeByKey(jsonImported.facultyResearch, supabaseSnapshot?.facultyResearch, "facultyId"),
  facultyProjects: mergeById(jsonImported.facultyProjects, supabaseSnapshot?.facultyProjects),
  infrastructure: mergeById(jsonImported.infrastructure, supabaseSnapshot?.infrastructure),
  hodSubmissions: mergeByKey(jsonImported.hodSubmissions, supabaseSnapshot?.hodSubmissions, "deptId"),
  facultyTargetSummaries: mergeByKey(
    jsonImported.facultyTargetSummaries,
    supabaseSnapshot?.facultyTargetSummaries,
    "deptId"
  ),
  facultyTargets: mergeByKey(jsonImported.facultyTargets, supabaseSnapshot?.facultyTargets, "facultyId"),
};

/**
 * Picks the imported dataset unless the mock flag is set, in which case the
 * generator runs. The builder is a thunk so the mock generator is never
 * executed — and its seed tables never touched — under the default.
 */
export function chooseData<T>(importedRows: T[], buildMock: () => T[]): T[] {
  return usingImportedData ? importedRows : buildMock();
}
