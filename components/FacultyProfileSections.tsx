import { BadgeIndianRupee, ExternalLink, FlaskConical, Target, UserRound } from "lucide-react";
import { facultyById, departmentById, projectsOf, researchOf, targetOf } from "@/data";
import { formatInr, publicationTrend } from "@/lib/aggregate";
import TrendChart from "./TrendChart";
import {
  Badge,
  BoolBadge,
  EmptyState,
  Field,
  FieldGrid,
  ProfileCard,
  ProgressBar,
  Section,
  StatusBadge,
  SubHeading,
} from "./ui";

const QUARTERS = [
  "Q1 · Jul–Sep 2026",
  "Q2 · Oct–Dec 2026",
  "Q3 · Jan–Mar 2027",
  "Q4 · Apr–Jun 2027",
];

export default function FacultyProfileSections({ facultyId }: { facultyId: string }) {
  const f = facultyById(facultyId);
  if (!f)
    return (
      <EmptyState
        title="Record not found"
        message="No faculty member matches this address. Go back to the roster and open a row from there."
      />
    );

  const dept = departmentById(f.deptId);
  const research = researchOf(f.id);
  const projects = projectsOf(f.id);
  const target = targetOf(f.id);
  const trend = publicationTrend(f.id);

  const journalTotal = research
    ? research.journalPublications.sciScieSsci +
      research.journalPublications.scopusUgcCare +
      research.journalPublications.other
    : 0;
  const conferenceTotal = research
    ? research.conferencePublications.international + research.conferencePublications.national
    : 0;

  return (
    <div className="space-y-6">
      {/* -------------------------------------------- identity & teaching */}
      <div id="identity" className="scroll-mt-6">
        <ProfileCard
          name={f.name}
          subtitle={`${f.designation} · ${dept?.name ?? f.deptId}`}
          badges={
            <>
              <Badge tone="seal">{f.appointmentType}</Badge>
              {f.hasPhd ? <Badge tone="positive">PhD</Badge> : null}
            </>
          }
          fields={[
            { label: "S.No. on department roster", value: f.sNo },
            { label: "Date of Joining", value: f.dateOfJoining },
            { label: "Teaching Load (Hrs/Week)", value: f.teachingLoadHrsPerWeek },
            { label: "PhD", value: <BoolBadge value={f.hasPhd} no="Not held" /> },
            { label: "Programme(s) for which Appointed", value: f.programmesAppointedFor },
            { label: "Additional Responsibility", value: f.additionalResponsibility },
            { label: "Department Dean", value: dept?.deanName },
            { label: "Head of Department", value: `${dept?.hodName} · ${dept?.hodContact}` },
            { label: "Reporting Period", value: dept?.reportingPeriod },
          ]}
          footer={`Faculty identifier ${f.id} · ${dept?.facultyOfEngineering}`}
        />
      </div>

      {/* ---------------------------------------------------- research output */}
      <Section
        id="research"
        title="Research output"
        description="Publications, citation performance, patents and doctoral supervision."
        icon={FlaskConical}
      >
        {!research ? (
          <EmptyState
            title="No research reported"
            message="This faculty member has not filed a research return for the current period."
          />
        ) : (
          <div className="space-y-7">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-ink-200 pb-5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "SCI / SCIE / SSCI", value: research.journalPublications.sciScieSsci },
                { label: "Scopus / UGC CARE", value: research.journalPublications.scopusUgcCare },
                { label: "Other journals", value: research.journalPublications.other },
                { label: "International conf.", value: research.conferencePublications.international },
                { label: "National conf.", value: research.conferencePublications.national },
                { label: "All publications", value: journalTotal + conferenceTotal },
              ].map((m) => (
                <div key={m.label}>
                  <p className="field-label">{m.label}</p>
                  <p className="mt-1 font-display text-h3 font-semibold tnum text-ink-900">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <SubHeading>Publications by year</SubHeading>
              <TrendChart
                data={trend}
                xKey="year"
                variant="bar"
                yLabel="Publications"
                series={[
                  { key: "journal", label: "Journal papers" },
                  { key: "conference", label: "Conference papers" },
                ]}
                emptyMessage="No year-wise publications have been reported for this faculty member."
              />
            </div>

            <FieldGrid cols={4}>
              <Field label="H-Index" value={research.hIndex} />
              <Field label="i10-Index" value={research.i10Index} />
              <Field label="Patents Filed" value={research.patents.filed} />
              <Field label="Patents Published" value={research.patents.published} />
              <Field label="Patents Granted" value={research.patents.granted} />
              <Field label="PhD Scholars Registered" value={research.phdSupervision.registered} />
              <Field label="PhD Scholars Awarded" value={research.phdSupervision.awarded} />
              <Field
                label="Google Scholar / ORCID"
                value={
                  <a
                    href={research.googleScholarOrcidLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-link"
                  >
                    Open scholar profile
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                }
              />
            </FieldGrid>
          </div>
        )}
      </Section>

      {/* --------------------------------------------------- sponsored projects */}
      <Section
        id="projects"
        title="Sponsored projects"
        description={
          projects.length === 0
            ? undefined
            : `${projects.length} project${projects.length === 1 ? "" : "s"} on record.`
        }
        icon={BadgeIndianRupee}
      >
        {projects.length === 0 ? (
          <EmptyState
            title="No sponsored projects"
            message="Nothing has been reported under sponsored or funded research for this faculty member."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {projects.map((p) => (
              <article
                key={p.id}
                className="rounded-panel border border-ink-200 px-4 py-4 transition-colors hover:border-ink-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-display text-lead font-semibold text-ink-900">
                    {p.sponsoringAgency}
                  </h3>
                  <StatusBadge status={p.currentStatus} />
                </div>
                <div className="mt-4">
                  <FieldGrid cols={2}>
                    <Field label="Year of Grant" value={p.yearOfGrant} />
                    <Field label="Duration" value={p.duration} />
                    <Field label="Sanctioned Amount" value={formatInr(p.sanctionedAmount)} />
                    <Field label="Amount Released" value={formatInr(p.amountReleased)} />
                  </FieldGrid>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    label="Released against sanction"
                    value={
                      p.sanctionedAmount
                        ? Math.round((p.amountReleased / p.sanctionedAmount) * 100)
                        : 0
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------ annual targets */}
      <Section
        id="targets"
        title="Annual targets"
        description={target ? `Review period ${target.reviewPeriod}` : undefined}
        icon={Target}
      >
        {!target ? (
          <EmptyState
            title="No target sheet filed"
            message="This faculty member has not agreed annual targets for the current review period."
          />
        ) : (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-panel border border-ink-200 bg-paper-sunken px-4 py-4">
              <div className="min-w-[15rem] flex-1">
                <ProgressBar
                  label="Milestone achievement"
                  value={target.milestoneAchievementPct}
                  srLabel="Milestone achievement percentage"
                />
              </div>
              <div>
                <p className="field-label">HoD priority</p>
                <div className="mt-1.5">
                  <StatusBadge status={target.hodPriority} />
                </div>
              </div>
              {target.milestoneAchievementPct < 50 ? (
                <div>
                  <p className="field-label">Review flag</p>
                  <div className="mt-1.5">
                    <Badge tone="priority">Behind plan</Badge>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <SubHeading>Faculty identification</SubHeading>
              <FieldGrid cols={4}>
                <Field label="S.No." value={target.sNo} />
                <Field label="Designation" value={target.designation} />
                <Field label="Nature of Appointment" value={target.natureOfAppointment} />
                <Field label="Date of Joining" value={target.dateOfJoining} />
              </FieldGrid>
            </div>

            <div>
              <SubHeading>Research publication targets</SubHeading>
              <FieldGrid cols={4}>
                <Field label="SCI / SCIE / SSCI Journal Papers" value={target.sciSciESsciJournalPapers} />
                <Field label="Scopus / UGC-CARE Journal Papers" value={target.scopusUgcCareJournalPapers} />
                <Field label="Q1 / Q2 Journal Papers (subset)" value={target.q1q2JournalPapersSubset} />
                <Field label="International Conference Papers" value={target.internationalConferencePapers} />
                <Field label="National Conference Papers" value={target.nationalConferencePapers} />
              </FieldGrid>
            </div>

            <div>
              <SubHeading>Sponsored research & consultancy targets</SubHeading>
              <FieldGrid cols={3}>
                <Field label="Govt. Sponsored Project Proposals (#)" value={target.govtSponsoredProjectProposals} />
                <Field label="Industry Project Proposals (#)" value={target.industryProjectProposals} />
                <Field label="Target Funding (₹ Lakh)" value={target.targetFundingLakh} />
                <Field label="Funding Agency / Agencies to be Targeted" value={target.fundingAgenciesTargeted} />
                <Field label="Tentative Project Theme / Title" value={target.tentativeProjectThemeTitle} />
                <Field label="Target Submission Month" value={target.targetSubmissionMonth} />
                <Field
                  label="Consultancy / Industry Assignment Proposals (#)"
                  value={target.consultancyIndustryAssignmentProposals}
                />
              </FieldGrid>
            </div>

            <div>
              <SubHeading>Patents & innovation targets</SubHeading>
              <FieldGrid cols={4}>
                <Field label="Patents to be Filed" value={target.patentsToBeFiled} />
                <Field label="Patents Expected to be Published" value={target.patentsExpectedPublished} />
                <Field label="Patents Expected to be Granted" value={target.patentsExpectedGranted} />
                <Field
                  label="Prototype / Product / Technology Proposed"
                  value={target.prototypeProductTechnologyProposed}
                />
              </FieldGrid>
            </div>

            <div>
              <SubHeading>Academic, student & institutional contribution</SubHeading>
              <FieldGrid cols={2}>
                <Field
                  label="New / Revised Course, Syllabus or Lab Development"
                  value={target.newRevisedCourseSyllabusOrLab}
                />
                <Field
                  label="e-Content / MOOC / Innovative Teaching"
                  value={target.eContentMoocInnovativeTeaching}
                />
                <Field
                  label="Student Mentoring / Hackathon / Internship / Placement Contribution"
                  value={target.studentMentoringHackathonInternshipPlacement}
                />
                <Field
                  label="Specific Contribution to Department Development"
                  value={target.contributionToDeptDevelopment}
                />
                <Field
                  label="Specific Contribution to University Development"
                  value={target.contributionToUniversityDevelopment}
                />
                <Field
                  label="Expected Measurable Outcome by June 2027"
                  value={target.expectedMeasurableOutcomeByJune2027}
                />
              </FieldGrid>
            </div>

            <div>
              <SubHeading>Quarterly milestones</SubHeading>
              <div className="table-scroll rounded-panel border border-ink-200">
                <table className="w-full min-w-[46rem] border-collapse">
                  <caption className="sr-only">
                    Planned milestone and reported status for each quarter of the review period
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="th w-28">
                        <span className="sr-only">Row</span>
                      </th>
                      {QUARTERS.map((q) => (
                        <th key={q} scope="col" className="th">
                          {q}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-paper-raised">
                      <th scope="row" className="td text-left text-micro font-semibold text-ink-500">
                        Plan
                      </th>
                      {[target.q1Plan, target.q2Plan, target.q3Plan, target.q4Plan].map((p, i) => (
                        <td key={i} className="td min-w-[12rem] whitespace-normal text-ink-700">
                          {p}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-paper-raised">
                      <th scope="row" className="td text-left text-micro font-semibold text-ink-500">
                        Status
                      </th>
                      {[target.q1Status, target.q2Status, target.q3Status, target.q4Status].map(
                        (s, i) => (
                          <td key={i} className="td">
                            <StatusBadge status={s} />
                          </td>
                        )
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <SubHeading>Review & achievement</SubHeading>
              <FieldGrid cols={2}>
                <Field
                  label="Milestone Achievement %"
                  value={<ProgressBar value={target.milestoneAchievementPct} />}
                />
                <Field label="HoD Priority" value={<StatusBadge status={target.hodPriority} />} />
                <Field
                  label="HoD Remarks / Support Required"
                  value={target.hodRemarksSupportRequired}
                />
                <Field
                  label="Year-end Achievement Summary"
                  value={target.yearEndAchievementSummary}
                />
              </FieldGrid>
            </div>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------- record as submitted */}
      <Section
        title="Record as submitted"
        description="The raw values filed by the department, before any calculation."
        icon={UserRound}
      >
        <FieldGrid cols={4}>
          <Field label="Faculty ID" value={f.id} />
          <Field label="Department" value={dept?.name} />
          <Field label="Name of Faculty Member" value={f.name} />
          <Field label="Designation" value={f.designation} />
          <Field label="Appointment Type" value={f.appointmentType} />
          <Field label="Date of Joining" value={f.dateOfJoining} />
          <Field label="PhD" value={<BoolBadge value={f.hasPhd} no="Not held" />} />
          <Field label="Teaching Load (Hrs/Week)" value={f.teachingLoadHrsPerWeek} />
        </FieldGrid>
      </Section>
    </div>
  );
}
