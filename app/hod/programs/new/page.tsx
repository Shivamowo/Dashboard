import { departmentById } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { hodAddProgram } from "@/lib/actions";
import ProgramForm from "@/components/ProgramForm";
import { PageHeading, Section } from "@/components/ui";

export default async function HodAddProgramPage() {
  const user = await requireSessionUser();
  const dept = departmentById(user.deptId!)!;
  return (
    <div>
      <PageHeading
        crumbs={[
          { label: `Head of Department · ${dept.shortName}`, href: "/hod" },
          { label: "Programmes", href: "/hod/programs" },
          { label: "Add programme" },
        ]}
        title="Add programme"
        subtitle={`New programme in ${dept.name}.`}
      />
      <Section title="Programme details">
        <ProgramForm action={hodAddProgram} submitLabel="Add programme" />
      </Section>
    </div>
  );
}
