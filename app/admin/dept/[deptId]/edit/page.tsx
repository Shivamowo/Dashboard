import { notFound } from "next/navigation";
import { departmentById, hodSubmissionOf } from "@/data";
import { adminUpdateDept } from "@/lib/actions";
import { FormActions, FormGrid, SelectField, TextField } from "@/components/forms";
import { PageHeading, Section } from "@/components/ui";

const STATUSES = ["Submitted", "Pending", "Partial"] as const;

export default async function AdminDeptEditPage({ params }: { params: Promise<{ deptId: string }> }) {
  const { deptId } = await params;
  const dept = departmentById(deptId);
  if (!dept) notFound();
  const submission = hodSubmissionOf(dept.id);
  const submit = adminUpdateDept.bind(null, dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Administrator", href: "/admin" },
          { label: dept.shortName, href: `/admin/dept/${dept.id}` },
          { label: "Edit" },
        ]}
        title={`Edit ${dept.name}`}
        subtitle="Admin edits apply immediately — no approval step."
      />

      <Section title="HoD & submission details">
        <form action={submit} className="space-y-5">
          <FormGrid cols={3}>
            <TextField name="mobileContact" label="Mobile / Contact No." defaultValue={submission?.mobileContact ?? dept.hodContact} required />
            <TextField name="certificationSignedBy" label="Certification Signed By (HoD name)" defaultValue={submission?.certificationSignedBy ?? dept.hodName} required />
            <TextField name="certificationDate" label="Certification Date" defaultValue={submission?.certificationDate} placeholder="YYYY-MM-DD" required />
            <SelectField name="status" label="Submission Status" defaultValue={submission?.status ?? "Pending"} options={STATUSES} required />
          </FormGrid>
          <FormActions submitLabel="Save" />
        </form>
      </Section>
    </div>
  );
}
