import {
  facultyById,
  projectsOf,
  requestsSubmittedByUser,
  researchOf,
  targetOf,
} from "@/data";
import { requireSessionUser } from "@/lib/session";
import {
  submitOwnFacultyProfile,
  submitOwnFacultyProjects,
  submitOwnFacultyResearch,
  submitOwnFacultyTarget,
} from "@/lib/actions";
import { CheckboxField, FormActions, FormGrid, NumberField, SelectField, TextAreaField, TextField } from "@/components/forms";
import { PendingRequestNotice, RejectedRequestNotice } from "@/components/PendingNotice";
import { EmptyState, PageHeading, Section } from "@/components/ui";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"] as const;
const APPOINTMENT_TYPES = ["Regular", "Contractual", "Self-Financing", "Guest"] as const;
const QUARTER_STATUSES = ["On track", "At risk", "Delayed", "Completed"] as const;
const HOD_PRIORITIES = ["High", "Medium", "Low"] as const;
const PROJECT_STATUSES = ["Ongoing", "Completed", "Submitted", "Sanctioned", "Closed"] as const;
const PROJECT_SLOTS = 4;

export default async function FacultyEditPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  const user = await requireSessionUser();
  if (!user.facultyId) {
    return (
      <div>
        <PageHeading crumbs={[{ label: "My record", href: "/faculty" }, { label: "Edit" }]} title="Edit my record" />
        <EmptyState
          title="Onboarding not yet approved"
          message="You can edit your record once Admin approves your onboarding. See your dashboard for the status."
        />
      </div>
    );
  }

  const f = facultyById(user.facultyId)!;
  const research = researchOf(f.id);
  const target = targetOf(f.id);
  const projects = projectsOf(f.id);
  const mine = requestsSubmittedByUser(user.id).filter((c) => c.targetEntity === "Faculty");

  const forSection = (section: string) => ({
    pending: mine.find((c) => c.status === "pending" && c.section === section),
    rejected: mine.find((c) => c.status === "rejected" && c.section === section),
  });
  const profile = forSection("profile");
  const researchCr = forSection("research");
  const targetCr = forSection("target");
  const projectsCr = forSection("projects");

  const submitProfile = submitOwnFacultyProfile;
  const submitResearch = submitOwnFacultyResearch;
  const submitTarget = submitOwnFacultyTarget;
  const submitProjects = submitOwnFacultyProjects;

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "My record", href: "/faculty" }, { label: "Edit" }]}
        title="Edit my record"
        subtitle="Changes are submitted for Admin approval and only apply once approved."
      />

      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">
          Your change has been submitted for approval.
        </p>
      ) : null}

      <div className="space-y-6">
        <Section title="Identity & teaching" description="Every field on your appointment record.">
          {profile.pending ? <div className="mb-5"><PendingRequestNotice cr={profile.pending} title="Profile update" /></div> : null}
          {!profile.pending && profile.rejected ? <div className="mb-5"><RejectedRequestNotice cr={profile.rejected} title="Your last profile update" /></div> : null}
          <form action={submitProfile} className="space-y-5">
            <FormGrid cols={3}>
              <TextField name="name" label="Name of Faculty Member" defaultValue={f.name} required />
              <SelectField name="designation" label="Designation" defaultValue={f.designation} options={DESIGNATIONS} required />
              <SelectField name="appointmentType" label="Appointment Type" defaultValue={f.appointmentType} options={APPOINTMENT_TYPES} required />
              <TextField name="dateOfJoining" label="Date of Joining" defaultValue={f.dateOfJoining} placeholder="DD/MM/YYYY" required />
              <CheckboxField name="hasPhd" label="Holds a PhD" defaultChecked={f.hasPhd} />
              <NumberField name="teachingLoadHrsPerWeek" label="Teaching Load (Hrs/Week)" defaultValue={f.teachingLoadHrsPerWeek} required />
              <TextField name="programmesAppointedFor" label="Programme(s) for which Appointed" defaultValue={f.programmesAppointedFor} required />
              <TextField name="additionalResponsibility" label="Additional Responsibility" defaultValue={f.additionalResponsibility} />
            </FormGrid>
            <FormActions />
          </form>
        </Section>

        <Section title="Research output" description="Publications, indices, patents and doctoral supervision.">
          {researchCr.pending ? <div className="mb-5"><PendingRequestNotice cr={researchCr.pending} title="Research update" /></div> : null}
          {!researchCr.pending && researchCr.rejected ? <div className="mb-5"><RejectedRequestNotice cr={researchCr.rejected} title="Your last research update" /></div> : null}
          <form action={submitResearch} className="space-y-5">
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
            <FormActions />
          </form>
        </Section>

        <Section title="Sponsored projects" description="Up to four projects — leave the sponsoring agency blank for an unused slot.">
          {projectsCr.pending ? <div className="mb-5"><PendingRequestNotice cr={projectsCr.pending} title="Projects update" /></div> : null}
          {!projectsCr.pending && projectsCr.rejected ? <div className="mb-5"><RejectedRequestNotice cr={projectsCr.rejected} title="Your last projects update" /></div> : null}
          <form action={submitProjects} className="space-y-6">
            <input type="hidden" name="projectCount" value={PROJECT_SLOTS} />
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
            <FormActions />
          </form>
        </Section>

        <Section title="Annual targets" description="Full annual target sheet for the current review period.">
          {targetCr.pending ? <div className="mb-5"><PendingRequestNotice cr={targetCr.pending} title="Targets update" /></div> : null}
          {!targetCr.pending && targetCr.rejected ? <div className="mb-5"><RejectedRequestNotice cr={targetCr.rejected} title="Your last targets update" /></div> : null}
          <form action={submitTarget} className="space-y-6">
            <FormGrid cols={4}>
              <TextField name="designation" label="Designation" defaultValue={target?.designation ?? f.designation} required />
              <TextField name="natureOfAppointment" label="Nature of Appointment" defaultValue={target?.natureOfAppointment ?? f.appointmentType} required />
              <TextField name="dateOfJoining" label="Date of Joining" defaultValue={target?.dateOfJoining ?? f.dateOfJoining} required />
              <TextField name="reviewPeriod" label="Review Period" defaultValue={target?.reviewPeriod ?? "July 2026 - June 2027"} required />
            </FormGrid>

            <FormGrid cols={4}>
              <NumberField name="sciSciESsciJournalPapers" label="SCI/SCIE/SSCI Journal Papers (target)" defaultValue={target?.sciSciESsciJournalPapers ?? 0} />
              <NumberField name="scopusUgcCareJournalPapers" label="Scopus/UGC-CARE Journal Papers (target)" defaultValue={target?.scopusUgcCareJournalPapers ?? 0} />
              <NumberField name="q1q2JournalPapersSubset" label="Q1/Q2 Journal Papers (subset)" defaultValue={target?.q1q2JournalPapersSubset ?? 0} />
              <NumberField name="internationalConferencePapers" label="International Conference Papers (target)" defaultValue={target?.internationalConferencePapers ?? 0} />
              <NumberField name="nationalConferencePapers" label="National Conference Papers (target)" defaultValue={target?.nationalConferencePapers ?? 0} />
            </FormGrid>

            <FormGrid cols={3}>
              <NumberField name="govtSponsoredProjectProposals" label="Govt. Sponsored Project Proposals (#)" defaultValue={target?.govtSponsoredProjectProposals ?? 0} />
              <NumberField name="industryProjectProposals" label="Industry Project Proposals (#)" defaultValue={target?.industryProjectProposals ?? 0} />
              <NumberField name="targetFundingLakh" label="Target Funding (₹ Lakh)" defaultValue={target?.targetFundingLakh ?? 0} />
              <TextField name="fundingAgenciesTargeted" label="Funding Agency / Agencies to be Targeted" defaultValue={target?.fundingAgenciesTargeted ?? ""} />
              <TextField name="tentativeProjectThemeTitle" label="Tentative Project Theme / Title" defaultValue={target?.tentativeProjectThemeTitle ?? ""} />
              <TextField name="targetSubmissionMonth" label="Target Submission Month" defaultValue={target?.targetSubmissionMonth ?? ""} />
              <NumberField name="consultancyIndustryAssignmentProposals" label="Consultancy/Industry Assignment Proposals (#)" defaultValue={target?.consultancyIndustryAssignmentProposals ?? 0} />
            </FormGrid>

            <FormGrid cols={4}>
              <NumberField name="patentsToBeFiled" label="Patents to be Filed" defaultValue={target?.patentsToBeFiled ?? 0} />
              <NumberField name="patentsExpectedPublished" label="Patents Expected Published" defaultValue={target?.patentsExpectedPublished ?? 0} />
              <NumberField name="patentsExpectedGranted" label="Patents Expected Granted" defaultValue={target?.patentsExpectedGranted ?? 0} />
              <TextField name="prototypeProductTechnologyProposed" label="Prototype / Product / Technology Proposed" defaultValue={target?.prototypeProductTechnologyProposed ?? ""} />
            </FormGrid>

            <FormGrid cols={2}>
              <TextAreaField name="newRevisedCourseSyllabusOrLab" label="New / Revised Course, Syllabus or Lab Development" defaultValue={target?.newRevisedCourseSyllabusOrLab ?? ""} />
              <TextAreaField name="eContentMoocInnovativeTeaching" label="e-Content / MOOC / Innovative Teaching" defaultValue={target?.eContentMoocInnovativeTeaching ?? ""} />
              <TextAreaField name="studentMentoringHackathonInternshipPlacement" label="Student Mentoring / Hackathon / Internship / Placement" defaultValue={target?.studentMentoringHackathonInternshipPlacement ?? ""} />
              <TextAreaField name="contributionToDeptDevelopment" label="Contribution to Department Development" defaultValue={target?.contributionToDeptDevelopment ?? ""} />
              <TextAreaField name="contributionToUniversityDevelopment" label="Contribution to University Development" defaultValue={target?.contributionToUniversityDevelopment ?? ""} />
              <TextAreaField name="expectedMeasurableOutcomeByJune2027" label="Expected Measurable Outcome by June 2027" defaultValue={target?.expectedMeasurableOutcomeByJune2027 ?? ""} />
            </FormGrid>

            <FormGrid cols={4}>
              <TextAreaField name="q1Plan" label="Q1 Plan" defaultValue={target?.q1Plan ?? ""} rows={2} />
              <TextAreaField name="q2Plan" label="Q2 Plan" defaultValue={target?.q2Plan ?? ""} rows={2} />
              <TextAreaField name="q3Plan" label="Q3 Plan" defaultValue={target?.q3Plan ?? ""} rows={2} />
              <TextAreaField name="q4Plan" label="Q4 Plan" defaultValue={target?.q4Plan ?? ""} rows={2} />
              <SelectField name="q1Status" label="Q1 Status" defaultValue={target?.q1Status ?? "On track"} options={QUARTER_STATUSES} />
              <SelectField name="q2Status" label="Q2 Status" defaultValue={target?.q2Status ?? "On track"} options={QUARTER_STATUSES} />
              <SelectField name="q3Status" label="Q3 Status" defaultValue={target?.q3Status ?? "On track"} options={QUARTER_STATUSES} />
              <SelectField name="q4Status" label="Q4 Status" defaultValue={target?.q4Status ?? "On track"} options={QUARTER_STATUSES} />
            </FormGrid>

            <FormGrid cols={4}>
              <NumberField name="milestoneAchievementPct" label="Milestone Achievement %" defaultValue={target?.milestoneAchievementPct ?? 0} />
              <SelectField name="hodPriority" label="HoD Priority" defaultValue={target?.hodPriority ?? "Medium"} options={HOD_PRIORITIES} />
              <TextAreaField name="hodRemarksSupportRequired" label="HoD Remarks / Support Required" defaultValue={target?.hodRemarksSupportRequired ?? ""} />
              <TextAreaField name="yearEndAchievementSummary" label="Year-end Achievement Summary" defaultValue={target?.yearEndAchievementSummary ?? ""} />
            </FormGrid>
            <FormActions />
          </form>
        </Section>
      </div>
    </div>
  );
}
