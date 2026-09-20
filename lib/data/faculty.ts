import {
  addFacultyRecord,
  departments as allDepartments,
  faculty,
  facultyById,
  removeFacultyRecord,
  updateFacultyRecord,
  type Faculty,
} from "@/data";
import {
  isPhd,
  normalizeName,
  validateFaculty,
  type FacultyErrors,
  type FacultyInput,
} from "./faculty-schema";

/**
 * THE ONLY PLACE FACULTY DATA IS MUTATED.
 *
 * Components and server actions call these functions and never touch the store
 * (data/faculty.ts arrays) directly. Today they read and write the in-memory
 * mock store; moving to a database means rewriting the bodies below and nothing
 * else — signatures stay async and return the same shapes.
 */

export class FacultyValidationError extends Error {
  constructor(public errors: FacultyErrors) {
    super("Faculty details are invalid.");
  }
}

/** Duplicate rule matches the importer: employee ID, else normalised name. */
function findDuplicate(input: FacultyInput): Faculty | undefined {
  const id = input.employeeId.trim().toLowerCase();
  return faculty.find(
    (f) =>
      (f.employeeId && f.employeeId.trim().toLowerCase() === id) ||
      normalizeName(f.name) === normalizeName(input.name)
  );
}

/** Appends to the in-memory store and returns the new record. */
export async function createFaculty(input: FacultyInput): Promise<Faculty> {
  const errors = validateFaculty(input);
  const known = new Set(allDepartments.map((d) => d.id));
  if (input.departments.some((d) => !known.has(d))) errors.departments = "Unknown department selected.";
  const dup = Object.keys(errors).length ? undefined : findDuplicate(input);
  if (dup) errors.employeeId = `Already on record as ${dup.name}. Add ${dup.name}'s other departments by editing that record.`;
  if (Object.keys(errors).length) throw new FacultyValidationError(errors);

  const id = addFacultyRecord(input.departments, {
    name: input.name.trim(),
    employeeId: input.employeeId.trim(),
    email: input.email.trim(),
    qualification: input.qualification.trim(),
    specialization: input.specialization.trim(),
    designation: input.designation,
    appointmentType: null,
    dateOfJoining: input.dateOfJoining,
    hasPhd: isPhd(input.qualification),
    programmesAppointedFor: null,
    teachingLoadHrsPerWeek: null,
    additionalResponsibility: null,
  });
  return facultyById(id)!;
}

/** STUB — not wired to any UI yet. */
export async function updateFaculty(id: string, patch: Partial<FacultyInput>): Promise<Faculty | undefined> {
  const f = facultyById(id);
  if (!f) return undefined;
  const { departments, ...rest } = patch;
  updateFacultyRecord(id, { ...f, ...rest, hasPhd: rest.qualification ? isPhd(rest.qualification) : f.hasPhd });
  if (departments?.length) {
    f.departments = departments;
    f.primaryDepartment = departments[0];
  }
  return f;
}

/** STUB — not wired to any UI yet. */
export async function deleteFaculty(id: string): Promise<boolean> {
  return removeFacultyRecord(id);
}
