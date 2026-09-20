import { BookOpen, Building2, FileCheck2, GraduationCap, TrendingUp, Users } from "lucide-react";
import { departments, hodSubmissions, programs } from "@/data";
import { rollupUniversity } from "@/lib/aggregate";
import { deptNameMap, rosterRows } from "@/lib/rows";
import ComplianceTable from "@/components/tables/ComplianceTable";
import FacultyRosterTable from "@/components/tables/FacultyRosterTable";
import ProgramStatsTable from "@/components/tables/ProgramStatsTable";
import { KpiCard, KpiRow, PageHeading, Section } from "@/components/ui";

export default function RegistrarDashboard() {
  const uni = rollupUniversity();
  const roster = rosterRows();
  const deptNames = deptNameMap();
  const submissions = hodSubmissions();
  const received = submissions.filter((s) => s.status === "Submitted").length;

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

  const programRows = programs.map((p) => ({ ...p, deptName: deptNames[p.deptId] ?? p.deptId }));

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Registrar" }]}
        title="University register"
        subtitle="Faculty appointments, departmental submissions and programme admissions across the university."
      />

      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard href="/registrar/departments" destination="the department list" label="Departments" value={uni.deptCount} icon={Building2} />
          <KpiCard href="/registrar/programs" destination="the programme list" label="Programmes" value={uni.programCount} icon={BookOpen} />
          <KpiCard
            href="/registrar/faculty"
            destination="the faculty register"
            label="Faculty on record"
            value={uni.facultyCount}
            hint={`${uni.phdCount} hold a doctorate`}
            icon={Users}
          />
          <KpiCard href="/registrar/faculty?qualification=phd" destination="faculty with a PhD" label="Faculty with PhD" value={uni.phdPct} unit="%" tone="seal" icon={GraduationCap} />
          <KpiCard
            href="/registrar/programs?view=admissions"
            destination="admissions against intake by programme"
            label="Admitted against intake"
            value={`${uni.admitted2026} / ${uni.sanctionedIntake2026}`}
            hint={`${uni.fillRatePct}% of 2026 seats filled`}
            icon={TrendingUp}
          />
          <KpiCard
            href="#compliance"
            destination="the HoD compliance table"
            label="Submissions certified"
            value={`${received} / ${submissions.length}`}
            tone={received === submissions.length ? "positive" : "caution"}
            hint="Departments with a signed HoD certificate"
            icon={FileCheck2}
          />
        </KpiRow>
      </div>

      <div className="mt-6 space-y-6">
        <Section
          id="roster"
          title="Faculty register"
          description="Every appointment in the university. Filter by department, designation, doctorate or appointment type, then open a row for the full record."
          icon={Users}
        >
          <FacultyRosterTable
            rows={roster}
            hrefBase="/registrar/faculty"
            deptNames={deptNames}
            showDept
          />
        </Section>

        <Section
          id="compliance"
          title="HoD compliance"
          description="Submission and certification status reported by each head of department."
          icon={FileCheck2}
        >
          <ComplianceTable rows={complianceRows} hrefBase="/registrar/dept" />
        </Section>

        <Section
          id="programmes"
          title="Programme statistics"
          description="Sanctioned intake against students admitted for each programme, 2024 to 2026."
          icon={BookOpen}
        >
          <ProgramStatsTable rows={programRows} deptNames={deptNames} />
        </Section>
      </div>
    </div>
  );
}
