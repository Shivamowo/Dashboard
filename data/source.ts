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
export const imported = {
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

/**
 * Picks the imported dataset unless the mock flag is set, in which case the
 * generator runs. The builder is a thunk so the mock generator is never
 * executed — and its seed tables never touched — under the default.
 */
export function chooseData<T>(importedRows: T[], buildMock: () => T[]): T[] {
  return usingImportedData ? importedRows : buildMock();
}
