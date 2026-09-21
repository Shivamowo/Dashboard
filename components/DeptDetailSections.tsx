import { ExternalLink } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  FileCheck2,
  FlaskConical,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Pencil } from "lucide-react";
import { pairHint, pairValue } from "@/components/cells";
import Link from "next/link";
import {
  sourceSheetOf,
  departmentById,
  deptTargetSummaryOf,
  hodSubmissionOf,
  infrastructureByDept,
  pendingFacultyEditIds,
  pendingHodDeptIds,
  pendingInfraIds,
  programsByDept,
} from "@/data";
import { intakeTrend, rollupDept } from "@/lib/aggregate";
import { rosterRows, targetTrackerRows } from "@/lib/rows";
import FacultyRosterTable from "./tables/FacultyRosterTable";
import InfrastructureTable from "./tables/InfrastructureTable";
import ProgramsTable from "./tables/ProgramsTable";
import TargetsTrackerTable from "./tables/TargetsTrackerTable";
import TrendChart from "./TrendChart";
import {
  EmptyState,
  Field,
  FieldGrid,
  KpiCard,
  KpiRow,
  PendingBadge,
  Section,
  StatusBadge,
  SubHeading,
} from "./ui";

export default function DeptDetailSections({
  deptId,
  facultyHrefBase,
  showTargets = true,
  facultyEditHrefBase,
  infraEditHrefBase,
  hodEditHref,
}: {
  deptId: string;
  facultyHrefBase: string;
  showTargets?: boolean;
  /** When set (HoD/Admin), adds an Edit column to the faculty roster. */
  facultyEditHrefBase?: string;
  /** When set (Admin), adds an Edit column to the infrastructure table. */
  infraEditHrefBase?: string;
  /** When set (Admin), adds an Edit link on the HoD submission card. */
  hodEditHref?: string;
}) {
  const dept = departmentById(deptId);
  if (!dept)
    return (
      <EmptyState
        title="Department not found"
        message="No department matches this address. Return to the department list and pick one from there."
      />
    );

  const roll = rollupDept(dept);
  const submission = hodSubmissionOf(deptId);
  const targetSummary = deptTargetSummaryOf(deptId);
  const programs = programsByDept(deptId);
  const infra = infrastructureByDept(deptId);
  const roster = rosterRows(deptId);
  const targets = targetTrackerRows(deptId);
  const trend = intakeTrend(deptId);
  const pendingFaculty = pendingFacultyEditIds();
  const pendingInfra = pendingInfraIds();
  const hodPending = pendingHodDeptIds().has(deptId);

  return (
    <div className="space-y-6">
      {sourceSheetOf(deptId) ? (
        <a
          href={sourceSheetOf(deptId)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the source spreadsheet for ${dept.name} (opens in a new tab)`}
          className="btn-quiet inline-flex max-w-full items-center gap-2 break-words"
        >
          <ExternalLink aria-hidden className="h-4 w-4 shrink-0" />
          <span className="min-w-0">Source spreadsheet — {dept.name}</span>
        </a>
      ) : null}
      {/* ---------------------------------------------------- dept snapshot */}
      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard label="Programmes" value={roll.programCount} icon={BookOpen} />
          <KpiCard label="Faculty on record" value={roll.facultyCount} icon={Users} />
          <KpiCard
            label="Faculty with PhD"
            value={roll.phdPct}
            unit="%"
            hint={pairHint(roll.phdCount, roll.facultyCount, (a, b) => `${a} of ${b}`)}
            tone="seal"
            icon={GraduationCap}
          />
          <KpiCard
            label="Admitted against intake"
            value={pairValue(roll.admitted2026, roll.sanctionedIntake2026)}
            hint={
              roll.fillRatePct == null
                ? "2026 intake or admissions not reported"
                : `${roll.fillRatePct}% of 2026 seats filled`
            }
            icon={TrendingUp}
          />
          <KpiCard
            label="Publications reported"
            value={roll.totalPublications}
            hint={pairHint(
              roll.journalPublications,
              roll.conferencePublications,
              (j, c) => `${j} journal, ${c} conference`
            )}
            icon={FlaskConical}
          />
          <KpiCard
            label="Room utilisation"
            value={roll.avgUtilisation}
            unit="%"
            hint={`Average across ${roll.infraRooms} rooms`}
            tone={roll.avgUtilisation != null && roll.avgUtilisation < 60 ? "caution" : "positive"}
            icon={BarChart3}
          />
        </KpiRow>
      </div>

      {/* ------------------------------------------------ department profile */}
      <Section title="Department information" icon={Building2}>
        <FieldGrid cols={4}>
          <Field label="Faculty / School" value={dept.facultyOfEngineering} />
          <Field label="Name of Department" value={dept.name} />
          <Field label="Name of Dean" value={dept.deanName} />
          <Field label="Name of HoD" value={dept.hodName} />
          <Field label="Mobile / Contact No." value={dept.hodContact} />
          <Field label="Reporting Period" value={dept.reportingPeriod} />
          <Field label="Date of Submission" value={dept.dateOfSubmission} />
          <Field
            label="Submission Status"
            value={submission ? <StatusBadge status={submission.status} /> : null}
          />
        </FieldGrid>
      </Section>

      {/* -------------------------------------------------- intake vs admitted */}
      <Section
        title="Intake against admissions"
        description="Sanctioned seats and students admitted across every programme of the department."
        icon={TrendingUp}
      >
        <TrendChart
          data={trend}
          xKey="year"
          variant="bar"
          yLabel="Students"
          series={[
            { key: "sanctioned", label: "Sanctioned intake" },
            { key: "admitted", label: "Students admitted" },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------ programmes */}
      <Section
        id="programmes"
        title="Programmes"
        description="Every field as submitted. Scroll sideways for fees, intake and curriculum provisions."
        icon={BookOpen}
      >
        <ProgramsTable programs={programs} />
      </Section>

      {/* --------------------------------------------------------- faculty roster */}
      <Section
        id="roster"
        title="Faculty roster"
        description="Open a row to read that faculty member's full record."
        icon={Users}
      >
        <FacultyRosterTable
          rows={roster}
          hrefBase={facultyHrefBase}
          pendingIds={pendingFaculty}
          editHrefBase={facultyEditHrefBase}
        />
      </Section>

      {/* -------------------------------------------------------------- targets */}
      {showTargets ? (
        <Section
          id="targets"
          title="Annual targets"
          description={
            targetSummary
              ? `Review period ${targetSummary.reviewPeriod}. ${
                  roll.atRiskFaculty === 0
                    ? "No faculty member is behind plan."
                    : `${roll.atRiskFaculty} faculty ${
                        roll.atRiskFaculty === 1 ? "member is" : "members are"
                      } behind plan.`
                }`
              : undefined
          }
          icon={Target}
        >
          {targetSummary ? (
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              <KpiCard label="Faculty planned" value={targetSummary.totalFacultyPlanned} />
              <KpiCard label="Journal papers" value={targetSummary.journalPublicationTarget} />
              <KpiCard label="Conference papers" value={targetSummary.conferencePaperTarget} />
              <KpiCard label="Project proposals" value={targetSummary.sponsoredIndustryProposalsTarget} />
              <KpiCard label="Funding sought" value={targetSummary.targetFundingLakh} unit="₹ L" />
              <KpiCard label="Patents to file" value={targetSummary.patentFilingTarget} />
              <KpiCard
                label="Avg milestone"
                value={targetSummary.avgMilestoneAchievement}
                unit="%"
                tone={
                  targetSummary.avgMilestoneAchievement != null &&
                  targetSummary.avgMilestoneAchievement < 50
                    ? "caution"
                    : "positive"
                }
              />
            </div>
          ) : null}
          <TargetsTrackerTable rows={targets} hrefBase={facultyHrefBase} />
        </Section>
      ) : null}

      {/* ------------------------------------------------------- infrastructure */}
      <Section
        id="infrastructure"
        title="Infrastructure"
        description="Laboratories and classrooms with their weekly allocation and utilisation."
        icon={BarChart3}
        accent="teal"
      >
        <InfrastructureTable
          rows={infra}
          pendingIds={pendingInfra}
          editHrefBase={infraEditHrefBase}
        />
      </Section>

      {/* ------------------------------------------------------ HoD submission */}
      <Section
        id="submission"
        title="HoD submission"
        description="The department snapshot, recalculated from the reporting sheets rather than stored."
        icon={FileCheck2}
        actions={
          <span className="flex items-center gap-2">
            {hodPending ? <PendingBadge /> : null}
            {hodEditHref ? (
              <Link href={hodEditHref} className="btn-quiet">
                <Pencil aria-hidden className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : null}
          </span>
        }
      >
        {!submission ? (
          <EmptyState
            title="No submission on file"
            message="This department has not filed a return for the current reporting period."
          />
        ) : (
          <div className="space-y-6">
            <FieldGrid cols={4}>
              <Field label="Mobile / Contact No." value={submission.mobileContact} />
              <Field label="Date of Submission" value={submission.dateOfSubmission} />
              <Field label="Status" value={<StatusBadge status={submission.status} />} />
              <Field label="Certification by HoD" value={submission.certificationSignedBy} />
              <Field label="Certification Date" value={submission.certificationDate} />
            </FieldGrid>

            <div>
              <SubHeading>Department snapshot</SubHeading>
              <div className="table-scroll rounded-panel border border-ink-200">
                <table className="w-full min-w-[28rem] border-collapse">
                  <caption className="sr-only">
                    Department-level indicators calculated from the reporting sheets
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="th">
                        Indicator
                      </th>
                      <th scope="col" className="th text-right">
                        Reported value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["No. of Programmes", submission.snapshot.noOfProgrammes],
                      ["Total Faculty Reported", submission.snapshot.totalFacultyReported],
                      ["Total Sanctioned Student Intake (2026)", submission.snapshot.totalSanctionedIntake2026],
                      ["Faculty with PhD", submission.snapshot.facultyWithPhd],
                      ["Total Students Admitted (2026)", submission.snapshot.totalStudentsAdmitted2026],
                      ["Labs / Classrooms Reported", submission.snapshot.labsClassroomsReported],
                      ["Programmes with NEP Alignment", submission.snapshot.programmesWithNepAlignment],
                      ["Digital Smart Board Available", submission.snapshot.digitalSmartBoardAvailable],
                      ["Projector Available", submission.snapshot.projectorAvailable],
                    ].map(([label, value]) => (
                      <tr key={String(label)} className="bg-paper-raised">
                        <th scope="row" className="td text-left font-normal text-ink-700">
                          {label}
                        </th>
                        <td className="td text-right font-semibold text-ink-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
