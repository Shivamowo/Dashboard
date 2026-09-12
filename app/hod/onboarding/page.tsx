import { TriangleAlert } from "lucide-react";
import { departmentById, latestOnboardingForUser } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { submitHodOnboarding } from "@/lib/actions";
import { FormActions, FormGrid, TextField } from "@/components/forms";
import { Field, PageHeading, Section } from "@/components/ui";

export default async function HodOnboardingPage() {
  const user = await requireSessionUser();

  if (user.status !== "onboarding_incomplete") {
    return (
      <div>
        <PageHeading title="Onboarding already submitted" />
        <p className="text-body text-ink-600">
          Your onboarding is on file — go to <a href="/hod" className="btn-link">your dashboard</a> for its status.
        </p>
      </div>
    );
  }

  const dept = departmentById(user.deptId!)!;
  const prev = latestOnboardingForUser(user.id);
  const prevPayload = prev?.payload as { name?: string; mobileContact?: string } | undefined;

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Onboarding" }]}
        title="Complete your HoD onboarding"
        subtitle="Confirm your identity for this department. An Administrator reviews this before your dashboard is active."
      />

      {user.rejectionReason ? (
        <p className="mb-6 flex items-start gap-2 rounded-panel border border-alert-100 bg-alert-50 px-4 py-3 text-meta text-alert-700">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">Your last submission was rejected:</strong> {user.rejectionReason}
            <br />
            Correct the details below and submit again.
          </span>
        </p>
      ) : null}

      <Section title="Identity" description="Department is fixed to the one you chose at signup.">
        <form action={submitHodOnboarding} className="space-y-5">
          <FormGrid cols={2}>
            <Field label="Department" value={dept.name} />
            <TextField name="name" label="Full Name" defaultValue={prevPayload?.name ?? user.displayName} required />
            <TextField name="mobileContact" label="Mobile / Contact No." defaultValue={prevPayload?.mobileContact} required />
          </FormGrid>
          <FormActions submitLabel="Submit onboarding for approval" />
        </form>
      </Section>
    </div>
  );
}
