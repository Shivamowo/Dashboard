import { notFound } from "next/navigation";
import { departmentById, infrastructureById, pendingFor } from "@/data";
import { submitEtInfraEdit } from "@/lib/actions";
import { CheckboxField, FormActions, FormGrid, NumberField, TextAreaField, TextField } from "@/components/forms";
import { PendingRequestNotice } from "@/components/PendingNotice";
import { PageHeading, Section } from "@/components/ui";

export default async function EtInfraEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ infraId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { infraId } = await params;
  const { submitted } = await searchParams;
  const infra = infrastructureById(infraId);
  if (!infra) notFound();
  const dept = departmentById(infra.deptId);
  const pending = pendingFor("Infrastructure", infra.id);
  const submit = submitEtInfraEdit.bind(null, infra.id);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Engineering & Technical", href: "/et" }, { label: infra.labClassroomName ?? infra.id }]}
        title={`Edit ${infra.labClassroomName ?? infra.id}`}
        subtitle={`${dept?.name ?? infra.deptId}. Changes are submitted for Admin approval and only apply once approved.`}
      />

      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">
          Your change has been submitted for approval.
        </p>
      ) : null}

      <Section title="Room record" description="Every field reported for this room.">
        {pending ? <div className="mb-5"><PendingRequestNotice cr={pending} title="Room update" /></div> : null}
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
          <FormActions />
        </form>
      </Section>
    </div>
  );
}
