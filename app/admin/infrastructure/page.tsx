import { DoorOpen } from "lucide-react";
import { infrastructure } from "@/data";
import { deptNameMap } from "@/lib/rows";
import InfrastructureTable from "@/components/tables/InfrastructureTable";
import FilterChips from "@/components/drill/FilterChips";
import { PageHeading, Section } from "@/components/ui";

export default async function AdminInfrastructurePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const deptNames = deptNameMap();
  const view = (await searchParams).view;
  const utilisation = view === "utilisation";
  // Rooms with no reported figure are gaps, not 0% rooms — leave them out here.
  const rows = utilisation ? infrastructure.filter((r) => r.utilisationPct != null) : infrastructure;

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator", href: "/admin" }, { label: "Infrastructure" }]}
        title={utilisation ? "Room utilisation" : "Infrastructure register"}
        subtitle="Every room across every department. Admin edits apply immediately."
      />
      <FilterChips
        chips={utilisation ? [{ label: "View: Room utilisation", clearHref: "/admin/infrastructure" }] : []}
      />
      <Section title="Room register" icon={DoorOpen} accent="teal">
        <InfrastructureTable
          rows={rows}
          deptNames={deptNames}
          showDept
          editHrefBase="/admin/infra"
          initialSortKey={utilisation ? "util" : "name"}
        />
      </Section>
    </div>
  );
}
