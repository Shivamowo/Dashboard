import { departmentById, type Infrastructure } from "@/data";
import { hodAddInfra } from "@/lib/actions";
import { requireSessionUser } from "@/lib/session";
import { CheckboxField, FormActions, FormGrid, NumberField, TextAreaField, TextField } from "@/components/forms";
import { PageHeading, Section } from "@/components/ui";

export default async function HodAddInfraPage() {
  const user = await requireSessionUser();
  const infra = {} as Partial<Infrastructure>;
  const dept = departmentById(user.deptId!);
  const submit = hodAddInfra;

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Head of Department", href: "/hod" },
          { label: "Infrastructure", href: "/hod#infrastructure" },
          { label: "Add room" },
        ]}
        title="Add room / lab"
        subtitle={`${dept?.name ?? ""}. Saved immediately.`}
      />

      <Section title="Room record">
        <form action={submit} className="space-y-5">
          <FormGrid cols={3}>
            <TextField name="labClassroomName" label="Lab / Classroom Name" defaultValue={infra.labClassroomName} required />
            <TextField name="floorRoomNo" label="Floor & Room No." defaultValue={infra.floorRoomNo} />
            <NumberField name="hoursAllottedPerWeek" label="Hours Allotted / Week" defaultValue={infra.hoursAllottedPerWeek} />
            <NumberField name="currentWeeklyWorkingHours" label="Current Weekly Working Hours" defaultValue={infra.currentWeeklyWorkingHours} />
            <TextField name="labRoomInCharge" label="Lab / Room In-charge" defaultValue={infra.labRoomInCharge} />
            <TextField name="labAssistantSupportStaff" label="Lab Assistant / Support Staff" defaultValue={infra.labAssistantSupportStaff} />
            <NumberField name="studentCapacity" label="Student Capacity" defaultValue={infra.studentCapacity} />
            <NumberField name="utilisationPct" label="Utilisation (%)" defaultValue={infra.utilisationPct} />
            <CheckboxField name="digitalSmartBoard" label="Digital Smart Board Available" defaultChecked={infra.digitalSmartBoard} />
            <CheckboxField name="projector" label="Projector Available" defaultChecked={infra.projector} />
          </FormGrid>
          <FormGrid cols={2}>
            <TextAreaField name="majorEquipmentAvailable" label="Major Equipment / Computers Available" defaultValue={infra.majorEquipmentAvailable} />
            <TextAreaField name="programmesUsingFacility" label="Programme(s) / Courses Using Facility" defaultValue={infra.programmesUsingFacility} />
          </FormGrid>
          <FormActions submitLabel="Add room" />
        </form>
      </Section>
    </div>
  );
}
