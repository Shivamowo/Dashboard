import type { ReactNode } from "react";
import Link from "next/link";
import { UserPlus, BookOpen, Building2, DoorOpen, FlaskConical, Users } from "lucide-react";
import { departments, infrastructure, pendingFacultyEditIds, programs, sumOf, type Role } from "@/data";
import { deptRollups } from "@/lib/aggregate";
import { deptNameMap, rosterRows } from "@/lib/rows";
import { roleMeta } from "@/components/roles";
import DeptComparisonTable from "@/components/tables/DeptComparisonTable";
import FacultyRosterTable from "@/components/tables/FacultyRosterTable";
import InfrastructureTable from "@/components/tables/InfrastructureTable";
import ProgramStatsTable from "@/components/tables/ProgramStatsTable";
import PublicationsTable from "@/components/tables/PublicationsTable";
import { KpiCard, KpiRow, PageHeading, Section } from "@/components/ui";
import FilterChips, { type Chip } from "./FilterChips";

/**
 * Drill-down targets for the overview KPI cards. Each reads its query param on
 * the server, applies the filter on load and shows it as a removable chip.
 * Role-prefixed (/vc/faculty, /admin/programs, …) because the app scopes every
 * screen by role; the same components serve every role that has the cards.
 */
export type DrillRole = Extract<Role, "vc" | "registrar" | "admin">;
export type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const heading = (role: DrillRole, title: string, subtitle: string, meta?: ReactNode) => {
  const m = roleMeta(role);
  return (
    <PageHeading
      crumbs={[{ label: m.label, href: m.home }, { label: title }]}
      title={title}
      subtitle={subtitle}
      meta={meta}
    />
  );
};

export function DepartmentsDrill({ role }: { role: DrillRole }) {
  const rows = deptRollups().map((r) => ({
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
      {heading(role, "Departments", `${rows.length} departments. Faculty shared between departments are counted in each of them.`)}
      <Section title="All departments" icon={Building2}>
        <DeptComparisonTable rows={rows} hrefBase={`/${role}/dept`} />
      </Section>
    </div>
  );
}

export function FacultyDrill({ role, search }: { role: DrillRole; search: Search }) {
  const qualification = one(search.qualification)?.toLowerCase();
  const phdOnly = qualification === "phd";
  const all = rosterRows();
  const rows = phdOnly ? all.filter((r) => r.hasPhd === true) : all;
  const chips: Chip[] = phdOnly ? [{ label: "Qualification: PhD", clearHref: `/${role}/faculty` }] : [];
  const pending = role === "admin" ? pendingFacultyEditIds() : undefined;
  return (
    <div>
      {heading(
        role,
        phdOnly ? "Faculty with PhD" : "Faculty on record",
        `${rows.length} distinct faculty${phdOnly ? " hold a doctorate" : ""}. People serving several departments appear once here, with every department listed.`,
        role === "admin" ? (
          <Link href="/admin/faculty/new" className="btn-primary">
            <UserPlus aria-hidden className="h-4 w-4" />
            Add faculty
          </Link>
        ) : undefined
      )}
      <FilterChips chips={chips} />
      <Section title="Faculty register" icon={Users}>
        <FacultyRosterTable
          rows={rows}
          hrefBase={`/${role}/faculty`}
          deptNames={deptNameMap()}
          showDept
          pendingIds={pending}
        />
      </Section>
    </div>
  );
}

export function ProgramsDrill({ role, search }: { role: DrillRole; search: Search }) {
  const admissions = one(search.view) === "admissions";
  const names = deptNameMap();
  const all = programs.map((p) => ({ ...p, deptName: names[p.deptId] ?? p.deptId }));
  // Admissions view keeps programmes that reported a 2026 figure on either side.
  const rows = admissions
    ? all.filter((p) => p.admittedByYear.y2026 != null || p.sanctionedIntakeByYear.y2026 != null)
    : all;
  const adm = sumOf(rows, (p) => p.admittedByYear.y2026);
  const int = sumOf(rows, (p) => p.sanctionedIntakeByYear.y2026);
  const chips: Chip[] = admissions ? [{ label: "View: Admitted vs intake", clearHref: `/${role}/programs` }] : [];
  return (
    <div>
      {heading(
        role,
        admissions ? "Admitted against intake" : "Programmes",
        admissions
          ? "Sanctioned intake and students admitted per programme, 2024 to 2026."
          : `${rows.length} programmes across the university.`
      )}
      {admissions ? (
        <div className="mb-5">
          <KpiRow>
            <KpiCard label="Admitted 2026" value={adm} icon={Users} />
            <KpiCard label="Sanctioned intake 2026" value={int} icon={BookOpen} />
            <KpiCard
              label="Seats filled"
              value={adm != null && int ? Math.round((adm / int) * 100) : null}
              unit="%"
              tone="seal"
            />
          </KpiRow>
        </div>
      ) : null}
      <FilterChips chips={chips} />
      <Section title="Programme statistics" icon={BookOpen}>
        <ProgramStatsTable rows={rows} deptNames={names} />
      </Section>
    </div>
  );
}

export function PublicationsDrill({ role }: { role: DrillRole }) {
  const rows = rosterRows();
  return (
    <div>
      {heading(role, "Publications reported", "Journal and conference papers per faculty member, as reported by departments.")}
      <Section title="Publications by faculty" icon={FlaskConical}>
        <PublicationsTable rows={rows} hrefBase={`/${role}/faculty`} deptNames={deptNameMap()} />
      </Section>
    </div>
  );
}

export function InfrastructureDrill({ role, search }: { role: DrillRole; search: Search }) {
  const utilisation = one(search.view) === "utilisation";
  const names = deptNameMap();
  // Utilisation view keeps only rooms that reported a figure — an unreported
  // room is a gap, not a 0% room.
  const rows = utilisation ? infrastructure.filter((r) => r.utilisationPct != null) : infrastructure;
  const chips: Chip[] = utilisation ? [{ label: "View: Room utilisation", clearHref: `/${role}/infrastructure` }] : [];
  return (
    <div>
      {heading(
        role,
        utilisation ? "Room utilisation" : "Infrastructure",
        utilisation
          ? `${rows.length} rooms with a reported utilisation figure, lowest first.`
          : `${rows.length} laboratories and classrooms across ${departments.length} departments.`
      )}
      <FilterChips chips={chips} />
      <Section title="Room register" icon={DoorOpen}>
        <InfrastructureTable
          rows={rows}
          deptNames={names}
          showDept
          initialSortKey={utilisation ? "util" : "name"}
        />
      </Section>
    </div>
  );
}
