import { departmentById, hodSubmissionOf, requestsSubmittedByUser } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { submitHodOwnSubmission } from "@/lib/actions";
import { FormActions, FormGrid, TextField } from "@/components/forms";
import { PendingRequestNotice, RejectedRequestNotice } from "@/components/PendingNotice";
import { PageHeading, Section } from "@/components/ui";

export default async function HodEditPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  const user = await requireSessionUser();
  const dept = departmentById(user.deptId!)!;
  const submission = hodSubmissionOf(dept.id);
  const mine = requestsSubmittedByUser(user.id).filter((c) => c.targetEntity === "HoD" && c.type === "edit");
  const pending = mine.find((c) => c.status === "pending");
  const rejected = mine.find((c) => c.status === "rejected");

  return (
    <div>
      <PageHeading
        crumbs={[{ label: `Head of Department · ${dept.shortName}`, href: "/hod" }, { label: "Edit submission" }]}
        title="Edit my submission"
        subtitle="Changes are submitted for Admin approval and only apply once approved."
      />

      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">
          Your change has been submitted for approval.
        </p>
      ) : null}

      <Section title="HoD submission details" description="Contact and certification details for this department's return.">
        {pending ? <div className="mb-5"><PendingRequestNotice cr={pending} title="Submission update" /></div> : null}
        {!pending && rejected ? <div className="mb-5"><RejectedRequestNotice cr={rejected} title="Your last submission update" /></div> : null}
        <form action={submitHodOwnSubmission} className="space-y-5">
          <FormGrid cols={3}>
            <TextField name="mobileContact" label="Mobile / Contact No." defaultValue={submission?.mobileContact} required />
            <TextField name="certificationSignedBy" label="Certification Signed By" defaultValue={submission?.certificationSignedBy} required />
            <TextField name="certificationDate" label="Certification Date" defaultValue={submission?.certificationDate} placeholder="YYYY-MM-DD" required />
          </FormGrid>
          <FormActions />
        </form>
      </Section>
    </div>
  );
}
