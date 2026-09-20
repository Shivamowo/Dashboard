/**
 * Pure (no data-layer imports) so the client form and the server share ONE
 * validator. Anything that touches the store lives in ./faculty.ts.
 */
export interface FacultyInput {
  name: string;
  employeeId: string;
  designation: string;
  qualification: string;
  specialization: string;
  /** yyyy-mm-dd */
  dateOfJoining: string;
  email: string;
  /** Department ids. The first is the PRIMARY department. */
  departments: string[];
}

export type FacultyErrors = Partial<Record<keyof FacultyInput, string>>;

export const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"] as const;

/** Strip Dr./Prof./Mr./Ms./Mrs., collapse whitespace, lowercase. */
export const normalizeName = (n: string) =>
  n
    .toLowerCase()
    .replace(/\b(dr|prof|professor|mr|ms|mrs|miss)\b\.?/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isPhd = (qualification: string) => /ph\.?\s?d|doctor/i.test(qualification);

export function validateFaculty(d: FacultyInput): FacultyErrors {
  const e: FacultyErrors = {};
  if (!d.name.trim()) e.name = "Enter the faculty member's name.";
  if (!d.employeeId.trim()) e.employeeId = "Enter the employee ID.";
  if (!d.designation) e.designation = "Choose a designation.";
  if (!d.qualification.trim()) e.qualification = "Enter the highest qualification.";
  if (!d.specialization.trim()) e.specialization = "Enter the area of specialization.";
  if (!d.dateOfJoining) e.dateOfJoining = "Enter the date of joining.";
  else if (Number.isNaN(Date.parse(d.dateOfJoining))) e.dateOfJoining = "Enter a valid date.";
  if (!d.email.trim()) e.email = "Enter the email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Enter a valid email address.";
  if (d.departments.length === 0) e.departments = "Select at least one department.";
  return e;
}
