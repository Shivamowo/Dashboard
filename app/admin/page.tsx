import Link from "next/link";
import { Building2, ClipboardCheck, UserPlus, DoorOpen, FlaskConical, GraduationCap, Table2, TrendingUp, Users } from "lucide-react";
import { deptRollups, rollupUniversity } from "@/lib/aggregate";
import { pendingChangeRequests } from "@/data";
import DeptComparisonTable from "@/components/tables/DeptComparisonTable";
import { KpiCard, KpiRow, PageHeading, Section } from "@/components/ui";

export default function AdminDashboard() {
  const uni = rollupUniversity();
  const rolls = deptRollups();
  const pending = pendingChangeRequests();

  const comparisonRows = rolls.map((r) => ({
    id: r.dept.id,
    name: r.dept.name,
    hodName: r.dept.hodName,
    facultyCount: r.facultyCount,
    phdCount: r.phdCount,
    phdPct: r.phdPct,
    programCount: r.programCount,
    sanctionedIntake2026: r.sanctionedIntake2026,
    admitted2026: r.admitted2026,
    fillRatePct: r.fillRatePct,
    journalPublications: r.journalPublications,
    conferencePublications: r.conferencePublications,
    totalPublications: r.totalPublications,
    patentsFiled: r.patentsFiled,
    avgTeachingLoad: r.avgTeachingLoad,
    infraRooms: r.infraRooms,
    avgUtilisation: r.avgUtilisation,
    avgMilestonePct: r.avgMilestonePct,
    atRiskFaculty: r.atRiskFaculty,
  }));

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator" }]}
        title="Administration"
        subtitle="Full read/write access across every department, plus the edit-approval queue."
        meta={
          <span className="flex flex-wrap gap-2">
            <Link href="/admin/faculty/new" className="btn-primary">
              <UserPlus aria-hidden className="h-4 w-4" />
              Add faculty
            </Link>
            <Link href="/admin/approvals" className="btn-quiet">
              <ClipboardCheck aria-hidden className="h-4 w-4" />
              Approval queue{pending.length > 0 ? ` (${pending.length})` : ""}
            </Link>
          </span>
        }
      />

      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard href="/admin/departments"
            destination="the department list"
            label="Departments" value={uni.deptCount} icon={Building2} />
          <KpiCard
            href="/admin/faculty"
            destination="the faculty register"
            label="Faculty on record"
            value={uni.facultyCount}
            hint={`${uni.phdCount} hold a doctorate`}
            icon={Users}
          />
          <KpiCard href="/admin/faculty?qualification=phd" destination="faculty with a PhD" label="Faculty with PhD" value={uni.phdPct} unit="%" tone="seal" icon={GraduationCap} />
          <KpiCard
            href="/admin/programs?view=admissions"
            destination="admissions against intake by programme"
            label="Admitted against intake"
            value={`${uni.admitted2026} / ${uni.sanctionedIntake2026}`}
            hint={`${uni.fillRatePct}% of 2026 seats filled`}
            icon={TrendingUp}
          />
          <KpiCard
            href="/admin/publications"
            destination="publications by faculty"
            label="Publications reported"
            value={uni.totalPublications}
            hint={`${uni.journalPublications} journal, ${uni.conferencePublications} conference`}
            icon={FlaskConical}
          />
          <KpiCard
            href="/admin/approvals"
            destination="the approval queue"
            label="Pending approvals"
            value={pending.length}
            tone={pending.length > 0 ? "caution" : "positive"}
            hint="Edits and onboarding awaiting review"
            icon={ClipboardCheck}
          />
        </KpiRow>
      </div>

      <div className="mt-6 space-y-6">
        <Section
          id="departments"
          title="Departments"
          description="Sort on any column. Open a row for the full department record with inline edit access."
          icon={Table2}
        >
          <DeptComparisonTable rows={comparisonRows} hrefBase="/admin/dept" />
        </Section>

        <Section
          title="Infrastructure register"
          description="Every room across every department, editable directly."
          icon={DoorOpen}
          accent="teal"
          actions={
            <Link href="/admin/infrastructure" className="btn-link">
              Open register
            </Link>
          }
        >
          <p className="text-meta text-ink-600">
            {uni.infraRooms} rooms on record, {uni.avgUtilisation}% average utilisation.
          </p>
        </Section>
      </div>
    </div>
  );
}
