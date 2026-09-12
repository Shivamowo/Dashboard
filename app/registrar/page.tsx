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
  const received = hodSubmissions.filter((s) => s.status === "Submitted").length;

  const complianceRows = hodSubmissions.map((s) => {
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
        crumbs={[{ label: "Roles", href: "/" }, { label: "Registrar" }]}
        title="University register"
        subtitle="Faculty appointments, departmental submissions and programme admissions across the university."
      />

      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard label="Departments" value={uni.deptCount} icon={Building2} />
          <KpiCard label="Programmes" value={uni.programCount} icon={BookOpen} />
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
            label="Submissions certified"
            value={`${received} / ${hodSubmissions.length}`}
            tone={received === hodSubmissions.length ? "positive" : "caution"}
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
