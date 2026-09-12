import { DoorOpen } from "lucide-react";
import { infrastructure } from "@/data";
import { deptNameMap } from "@/lib/rows";
import InfrastructureTable from "@/components/tables/InfrastructureTable";
import { PageHeading, Section } from "@/components/ui";

export default function AdminInfrastructurePage() {
  const deptNames = deptNameMap();

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator", href: "/admin" }, { label: "Infrastructure" }]}
        title="Infrastructure register"
        subtitle="Every room across every department. Admin edits apply immediately."
      />
      <Section title="Room register" icon={DoorOpen} accent="teal">
        <InfrastructureTable rows={infrastructure} deptNames={deptNames} showDept editHrefBase="/admin/infra" />
      </Section>
    </div>
  );
}
