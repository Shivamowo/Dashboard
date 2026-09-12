import { notFound } from "next/navigation";
import { departmentById, infrastructureById } from "@/data";
import { adminUpdateInfra } from "@/lib/actions";
import { CheckboxField, FormActions, FormGrid, NumberField, TextAreaField, TextField } from "@/components/forms";
import { PageHeading, Section } from "@/components/ui";

export default async function AdminInfraEditPage({ params }: { params: Promise<{ infraId: string }> }) {
  const { infraId } = await params;
  const infra = infrastructureById(infraId);
  if (!infra) notFound();
  const dept = departmentById(infra.deptId);
  const submit = adminUpdateInfra.bind(null, infra.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Administrator", href: "/admin" },
          { label: "Infrastructure", href: "/admin/infrastructure" },
          { label: infra.labClassroomName },
        ]}
        title={`Edit ${infra.labClassroomName}`}
        subtitle={`${dept?.name ?? infra.deptId}. Admin edits apply immediately — no approval step.`}
      />

      <Section title="Room record">
        <form action={submit} className="space-y-5">
          <FormGrid cols={3}>
            <TextField name="labClassroomName" label="Lab / Classroom Name" defaultValue={infra.labClassroomName} required />
            <TextField name="floorRoomNo" label="Floor & Room No." defaultValue={infra.floorRoomNo} required />
            <NumberField name="hoursAllottedPerWeek" label="Hours Allotted / Week" defaultValue={infra.hoursAllottedPerWeek} required />
            <NumberField name="currentWeeklyWorkingHours" label="Current Weekly Working Hours" defaultValue={infra.currentWeeklyWorkingHours} required />
            <TextField name="labRoomInCharge" label="Lab / Room In-charge" defaultValue={infra.labRoomInCharge} required />
            <TextField name="labAssistantSupportStaff" label="Lab Assistant / Support Staff" defaultValue={infra.labAssistantSupportStaff} required />
            <NumberField name="studentCapacity" label="Student Capacity" defaultValue={infra.studentCapacity} required />
            <NumberField name="utilisationPct" label="Utilisation (%)" defaultValue={infra.utilisationPct} required />
            <CheckboxField name="digitalSmartBoard" label="Digital Smart Board Available" defaultChecked={infra.digitalSmartBoard} />
            <CheckboxField name="projector" label="Projector Available" defaultChecked={infra.projector} />
          </FormGrid>
          <FormGrid cols={2}>
            <TextAreaField name="majorEquipmentAvailable" label="Major Equipment / Computers Available" defaultValue={infra.majorEquipmentAvailable} required />
            <TextAreaField name="programmesUsingFacility" label="Programme(s) / Courses Using Facility" defaultValue={infra.programmesUsingFacility} required />
          </FormGrid>
          <FormActions submitLabel="Save" />
        </form>
      </Section>
    </div>
  );
}
