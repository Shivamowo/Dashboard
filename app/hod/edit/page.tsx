import { departmentById, hodSubmissionOf, requestsSubmittedByUser } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { submitHodOwnSubmission } from "@/lib/actions";
import { FormActions, FormGrid, SelectField, TextField } from "@/components/forms";
import { HOD_EDITS_NEED_APPROVAL } from "@/lib/feature-flags";
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
        title="Edit department details"
        subtitle={HOD_EDITS_NEED_APPROVAL ? "Changes are submitted for Admin approval and only apply once approved." : "Changes are saved immediately."}
      />

      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">
          {HOD_EDITS_NEED_APPROVAL ? "Your change has been submitted for approval." : "Saved."}
        </p>
      ) : null}

      <Section title="Department details" description="The header block of the department workbook.">
        {pending ? <div className="mb-5"><PendingRequestNotice cr={pending} title="Submission update" /></div> : null}
        {!pending && rejected ? <div className="mb-5"><RejectedRequestNotice cr={rejected} title="Your last submission update" /></div> : null}
        <form action={submitHodOwnSubmission} className="space-y-5">
          <FormGrid cols={3}>
            <TextField name="facultyOfEngineering" label="Faculty / School / Institute" defaultValue={dept.facultyOfEngineering} />
            <TextField name="deanName" label="Dean" defaultValue={dept.deanName} />
            <TextField name="hodName" label="Head of Department" defaultValue={dept.hodName} />
            <TextField name="mobileContact" label="Mobile / Contact No." defaultValue={submission?.mobileContact ?? dept.hodContact} />
            <TextField name="reportingPeriod" label="Reporting Period" defaultValue={dept.reportingPeriod} />
            <TextField name="dateOfSubmission" label="Date of Submission" defaultValue={dept.dateOfSubmission} placeholder="YYYY-MM-DD" />
            <TextField name="certificationSignedBy" label="Certification Signed By" defaultValue={submission?.certificationSignedBy} />
            <TextField name="certificationDate" label="Certification Date" defaultValue={submission?.certificationDate} placeholder="YYYY-MM-DD" />
            {HOD_EDITS_NEED_APPROVAL ? null : (
              <SelectField name="status" label="Submission Status" defaultValue={submission?.status ?? "Pending"} options={["Submitted", "Pending", "Partial"] as const} />
            )}
          </FormGrid>
          <FormActions submitLabel={HOD_EDITS_NEED_APPROVAL ? undefined : "Save"} />
        </form>
      </Section>
    </div>
  );
}
