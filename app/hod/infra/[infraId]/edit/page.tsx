import { notFound } from "next/navigation";
import { departmentById, infrastructureById } from "@/data";
import { submitHodInfraEdit } from "@/lib/actions";
import { requireSessionUser } from "@/lib/session";
import { HOD_EDITS_NEED_APPROVAL } from "@/lib/feature-flags";
import { EmptyState } from "@/components/ui";
import { Lock } from "lucide-react";
import { CheckboxField, FormActions, FormGrid, NumberField, TextAreaField, TextField } from "@/components/forms";
import { PageHeading, Section } from "@/components/ui";

export default async function HodInfraEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ infraId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { infraId } = await params;
  const { submitted } = await searchParams;
  const user = await requireSessionUser();
  const infra = infrastructureById(infraId);
  if (!infra) notFound();
  const dept = departmentById(infra.deptId);
  if (infra.deptId !== user.deptId) {
    return (
      <EmptyState icon={Lock} title="This room belongs to another department" message="You can edit rooms in your own department only." />
    );
  }
  const submit = submitHodInfraEdit.bind(null, infra.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Head of Department", href: "/hod" },
          { label: "Infrastructure", href: "/hod#infrastructure" },
          { label: infra.labClassroomName ?? infra.id },
        ]}
        title={`Edit ${infra.labClassroomName ?? infra.id}`}
        subtitle={`${dept?.name ?? infra.deptId}. ${HOD_EDITS_NEED_APPROVAL ? "Changes are submitted for Admin approval." : "Changes are saved immediately."}`}
      />

      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">
          {HOD_EDITS_NEED_APPROVAL ? "Your change has been submitted for approval." : "Saved."}
        </p>
      ) : null}

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
