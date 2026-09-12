import { latestOnboardingForUser, type FacultyProfileEdit, type FacultyProjectEdit, type FacultyResearchEdit } from "@/data";
import { getSessionUser } from "@/lib/session";
import { submitFacultyOnboarding } from "@/lib/actions";
import { CheckboxField, FormActions, FormGrid, NumberField, SelectField, TextField } from "@/components/forms";
import { PageHeading, Section } from "@/components/ui";
import { TriangleAlert } from "lucide-react";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"] as const;
const APPOINTMENT_TYPES = ["Regular", "Contractual", "Self-Financing", "Guest"] as const;
const PROJECT_STATUSES = ["Ongoing", "Completed", "Submitted", "Sanctioned", "Closed"] as const;
const PROJECT_SLOTS = 4;

export default async function FacultyOnboardingPage() {
  const user = (await getSessionUser())!;

  if (user.status !== "onboarding_incomplete") {
    return (
      <div>
        <PageHeading title="Onboarding already submitted" />
        <p className="text-body text-ink-600">
          Your onboarding is on file — go to <a href="/faculty" className="btn-link">your dashboard</a> for its
          status.
        </p>
      </div>
    );
  }

  const prev = latestOnboardingForUser(user.id);
  const prevPayload = prev?.payload as
    | { profile?: FacultyProfileEdit; research?: FacultyResearchEdit; projects?: FacultyProjectEdit[] }
    | undefined;
  const profile = prevPayload?.profile;
  const research = prevPayload?.research;
  const projects = prevPayload?.projects ?? [];

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Onboarding" }]}
        title="Complete your faculty onboarding"
        subtitle="Fill in your appointment and research details. An Administrator reviews this before your dashboard shows your record."
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

      <form action={submitFacultyOnboarding} className="space-y-6">
        <Section title="Identity & teaching" description="Every field on your appointment record.">
          <FormGrid cols={3}>
            <TextField name="name" label="Name of Faculty Member" defaultValue={profile?.name ?? user.displayName} required />
            <SelectField name="designation" label="Designation" defaultValue={profile?.designation ?? "Assistant Professor"} options={DESIGNATIONS} required />
            <SelectField name="appointmentType" label="Appointment Type" defaultValue={profile?.appointmentType ?? "Regular"} options={APPOINTMENT_TYPES} required />
            <TextField name="dateOfJoining" label="Date of Joining" defaultValue={profile?.dateOfJoining} placeholder="DD/MM/YYYY" required />
            <CheckboxField name="hasPhd" label="Holds a PhD" defaultChecked={profile?.hasPhd} />
            <NumberField name="teachingLoadHrsPerWeek" label="Teaching Load (Hrs/Week)" defaultValue={profile?.teachingLoadHrsPerWeek} required />
            <TextField name="programmesAppointedFor" label="Programme(s) for which Appointed" defaultValue={profile?.programmesAppointedFor} required />
            <TextField name="additionalResponsibility" label="Additional Responsibility" defaultValue={profile?.additionalResponsibility} placeholder="NA" />
          </FormGrid>
        </Section>

        <Section title="Research output" description="Leave at 0 if you have nothing to report yet — you can add it later from your record's edit screen.">
          <FormGrid cols={4}>
            <NumberField name="sciScieSsci" label="SCI / SCIE / SSCI Journal Papers" defaultValue={research?.journalPublications.sciScieSsci ?? 0} />
            <NumberField name="scopusUgcCare" label="Scopus / UGC CARE Journal Papers" defaultValue={research?.journalPublications.scopusUgcCare ?? 0} />
            <NumberField name="otherJournal" label="Other Journal Papers" defaultValue={research?.journalPublications.other ?? 0} />
            <NumberField name="intlConference" label="International Conference Papers" defaultValue={research?.conferencePublications.international ?? 0} />
            <NumberField name="nationalConference" label="National Conference Papers" defaultValue={research?.conferencePublications.national ?? 0} />
            <NumberField name="hIndex" label="H-Index" defaultValue={research?.hIndex ?? 0} />
            <NumberField name="i10Index" label="i10-Index" defaultValue={research?.i10Index ?? 0} />
            <TextField name="googleScholarOrcidLink" label="Google Scholar / ORCID Link" defaultValue={research?.googleScholarOrcidLink ?? ""} />
            <NumberField name="patentsFiled" label="Patents Filed" defaultValue={research?.patents.filed ?? 0} />
            <NumberField name="patentsPublished" label="Patents Published" defaultValue={research?.patents.published ?? 0} />
            <NumberField name="patentsGranted" label="Patents Granted" defaultValue={research?.patents.granted ?? 0} />
            <NumberField name="phdRegistered" label="PhD Scholars Registered" defaultValue={research?.phdSupervision.registered ?? 0} />
            <NumberField name="phdAwarded" label="PhD Scholars Awarded" defaultValue={research?.phdSupervision.awarded ?? 0} />
          </FormGrid>
        </Section>

        <Section title="Sponsored projects" description="Optional — leave every sponsoring agency blank if you have none to report.">
          <input type="hidden" name="projectCount" value={PROJECT_SLOTS} />
          <div className="space-y-4">
            {Array.from({ length: PROJECT_SLOTS }).map((_, i) => {
              const p = projects[i];
              return (
                <div key={i} className="rounded-panel border border-ink-200 px-4 py-4">
                  <p className="field-label mb-3">Project {i + 1}</p>
                  <FormGrid cols={3}>
                    <TextField name={`project-${i}-sponsoringAgency`} label="Sponsoring Agency" defaultValue={p?.sponsoringAgency} />
                    <NumberField name={`project-${i}-yearOfGrant`} label="Year of Grant" defaultValue={p?.yearOfGrant} />
                    <TextField name={`project-${i}-duration`} label="Duration" defaultValue={p?.duration} placeholder="e.g. 2 years" />
                    <NumberField name={`project-${i}-sanctionedAmount`} label="Sanctioned Amount (₹)" defaultValue={p?.sanctionedAmount} />
                    <NumberField name={`project-${i}-amountReleased`} label="Amount Released (₹)" defaultValue={p?.amountReleased} />
                    <SelectField name={`project-${i}-currentStatus`} label="Current Status" defaultValue={p?.currentStatus ?? "Ongoing"} options={PROJECT_STATUSES} />
                  </FormGrid>
                </div>
              );
            })}
          </div>
        </Section>

        <FormActions submitLabel="Submit onboarding for approval" />
      </form>
    </div>
  );
}
