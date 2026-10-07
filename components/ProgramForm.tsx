import type { Program } from "@/data";
import { FormActions, FormGrid, NumberField, TextAreaField, TextField } from "./forms";

/** Yes / No / not provided — a blank stays null, it is never coerced to "No". */
function TriField({ name, label, value }: { name: string; label: string; value?: boolean | null }) {
  const current = value === true ? "Yes" : value === false ? "No" : "";
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select id={name} name={name} defaultValue={current} className="input mt-1.5">
        <option value="">Not provided</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>
  );
}

/** Every column of the HoD workbook's "Program Details" sheet. */
export default function ProgramForm({
  action,
  program,
  submitLabel = "Save",
}: {
  action: (form: FormData) => void | Promise<void>;
  program?: Program;
  submitLabel?: string;
}) {
  const p = program;
  return (
    <form action={action} className="space-y-6">
      <FormGrid cols={3}>
        <TextField name="name" label="Programme name" defaultValue={p?.name} required />
        <NumberField name="yearOfCommencement" label="Year of commencement" defaultValue={p?.yearOfCommencement} min={1900} />
        <TextField name="modeOfProgramme" label="Mode of programme" defaultValue={p?.modeOfProgramme} placeholder="e.g. Regular, Self-financing" />
      </FormGrid>

      <div>
        <p className="field-label mb-3">Sanctioned faculty positions</p>
        <FormGrid cols={3}>
          <NumberField name="posProfessor" label="Professor" defaultValue={p?.sanctionedFacultyPositions.professor} />
          <NumberField name="posAssociate" label="Associate Professor" defaultValue={p?.sanctionedFacultyPositions.associateProfessor} />
          <NumberField name="posAssistant" label="Assistant Professor" defaultValue={p?.sanctionedFacultyPositions.assistantProfessor} />
        </FormGrid>
      </div>

      <div>
        <p className="field-label mb-3">Sanctioned intake</p>
        <FormGrid cols={3}>
          <NumberField name="intake2024" label="2024" defaultValue={p?.sanctionedIntakeByYear.y2024} />
          <NumberField name="intake2025" label="2025" defaultValue={p?.sanctionedIntakeByYear.y2025} />
          <NumberField name="intake2026" label="2026" defaultValue={p?.sanctionedIntakeByYear.y2026} />
        </FormGrid>
      </div>

      <div>
        <p className="field-label mb-3">Students admitted</p>
        <FormGrid cols={3}>
          <NumberField name="admitted2024" label="2024" defaultValue={p?.admittedByYear.y2024} />
          <NumberField name="admitted2025" label="2025" defaultValue={p?.admittedByYear.y2025} />
          <NumberField name="admitted2026" label="2026" defaultValue={p?.admittedByYear.y2026} />
        </FormGrid>
      </div>

      <div>
        <p className="field-label mb-3">Semester fee (₹)</p>
        <FormGrid cols={3}>
          <NumberField name="fee2024" label="2024" defaultValue={p?.semesterFeeByYear.y2024} />
          <NumberField name="fee2025" label="2025" defaultValue={p?.semesterFeeByYear.y2025} />
          <NumberField name="fee2026" label="2026" defaultValue={p?.semesterFeeByYear.y2026} />
        </FormGrid>
      </div>

      <FormGrid cols={4}>
        <TriField name="nepAligned" label="NEP aligned" value={p?.nepAligned} />
        <TriField name="multipleEntryExit" label="Multiple entry / exit" value={p?.multipleEntryExit} />
        <TriField name="internshipEndOfYear" label="Internship at end of year" value={p?.internshipEndOfYear} />
        <TriField name="minorSpecialisationAvailable" label="Minor / specialisation available" value={p?.minorSpecialisationAvailable} />
      </FormGrid>

      <TextAreaField name="remarks" label="Remarks" defaultValue={p?.remarks} />
      <FormActions submitLabel={submitLabel} />
    </form>
  );
}
