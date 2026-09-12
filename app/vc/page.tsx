import {
  BarChart3,
  Building2,
  FileCheck2,
  FlaskConical,
  GraduationCap,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";
import { deptRollups, intakeTrend, rollupUniversity } from "@/lib/aggregate";
import { departments, hodSubmissions } from "@/data";
import DeptComparisonTable from "@/components/tables/DeptComparisonTable";
import ComplianceTable from "@/components/tables/ComplianceTable";
import TrendChart from "@/components/TrendChart";
import { KpiCard, KpiRow, PageHeading, Section } from "@/components/ui";

export default function VcDashboard() {
  const uni = rollupUniversity();
  const rolls = deptRollups();
  const trend = intakeTrend();

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

  const submissions = hodSubmissions();
  const complianceRows = submissions.map((s) => {
    const d = departments.find((x) => x.id === s.deptId)!;
    return {
      deptId: s.deptId,
      deptName: d.name,
      hodName: d.hodName,
      mobileContact: s.mobileContact,
      dateOfSubmission: s.dateOfSubmission,
      status: s.status,
      certificationSignedBy: s.certificationSignedBy,
      certificationDate: s.certificationDate,
      ...s.snapshot,
    };
  });

  const publicationsByDept = rolls.map((r) => ({
    dept: r.dept.shortName,
    journal: r.journalPublications,
    conference: r.conferencePublications,
  }));

  const pending = submissions.filter((s) => s.status !== "Submitted").length;

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Vice Chancellor" }]}
        title="University overview"
        subtitle="Every figure below is calculated from the departmental submissions as they stand today."
      />

      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard
            label="Departments"
            value={uni.deptCount}
            hint={`${uni.programCount} programmes running`}
            icon={Building2}
          />
          <KpiCard
            label="Faculty on record"
            value={uni.facultyCount}
            hint={`${uni.phdCount} hold a doctorate`}
            icon={Users}
          />
          <KpiCard label="Faculty with PhD" value={uni.phdPct} unit="%" tone="seal" icon={GraduationCap} />
          <KpiCard
            label="Admitted against intake"
            value={`${uni.admitted2026} / ${uni.sanctionedIntake2026}`}
            hint={`${uni.fillRatePct}% of 2026 seats filled`}
            icon={TrendingUp}
          />
          <KpiCard
            label="Publications reported"
            value={uni.totalPublications}
            hint={`${uni.journalPublications} journal, ${uni.conferencePublications} conference`}
            icon={FlaskConical}
          />
          <KpiCard
            label="Room utilisation"
            value={uni.avgUtilisation}
            unit="%"
            hint={`Average across ${uni.infraRooms} rooms`}
            tone={uni.avgUtilisation < 60 ? "caution" : "positive"}
            icon={BarChart3}
          />
        </KpiRow>
      </div>

      <div id="trends" className="mt-6 grid scroll-mt-6 grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Intake against admissions"
          description="University-wide sanctioned seats and students actually admitted, 2024 to 2026."
          icon={TrendingUp}
        >
          <TrendChart
            data={trend}
            xKey="year"
            variant="line"
            yLabel="Students"
            series={[
              { key: "sanctioned", label: "Sanctioned intake" },
              { key: "admitted", label: "Students admitted" },
            ]}
          />
        </Section>

        <Section
          title="Research output by department"
          description="Total publications reported by faculty in each department."
          icon={FlaskConical}
        >
          <TrendChart
            data={publicationsByDept}
            xKey="dept"
            variant="bar"
            yLabel="Publications"
            series={[
              { key: "journal", label: "Journal papers" },
              { key: "conference", label: "Conference papers" },
            ]}
          />
        </Section>
      </div>

      <div className="mt-6 space-y-6">
        <Section
          id="comparison"
          title="Department comparison"
          description="Sort on any column. Open a row to see that department in full."
          icon={Table2}
        >
          <DeptComparisonTable rows={comparisonRows} hrefBase="/vc/dept" />
        </Section>

        <Section
          id="compliance"
          title="Submission compliance"
          description={
            pending === 0
              ? "Every department has certified its submission."
              : `${pending} department${pending === 1 ? "" : "s"} still to certify a submission.`
          }
          icon={FileCheck2}
        >
          <ComplianceTable rows={complianceRows} hrefBase="/vc/dept" />
        </Section>
      </div>
    </div>
  );
}
