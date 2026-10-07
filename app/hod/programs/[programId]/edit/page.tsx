import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { departmentById, programById } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { hodUpdateProgram } from "@/lib/actions";
import ProgramForm from "@/components/ProgramForm";
import { EmptyState, PageHeading, Section } from "@/components/ui";

export default async function HodProgramEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { programId } = await params;
  const { submitted } = await searchParams;
  const user = await requireSessionUser();
  const program = programById(programId);
  if (!program) notFound();
  const dept = departmentById(user.deptId!)!;
  if (program.deptId !== user.deptId) {
    return <EmptyState icon={Lock} title="This programme belongs to another department" message="You can edit programmes in your own department only." />;
  }
  return (
    <div>
      <PageHeading
        crumbs={[
          { label: `Head of Department · ${dept.shortName}`, href: "/hod" },
          { label: "Programmes", href: "/hod/programs" },
          { label: program.name },
        ]}
        title={`Edit ${program.name}`}
        subtitle="Changes are saved immediately."
      />
      {submitted ? (
        <p className="mb-6 rounded-panel border border-success-100 bg-success-50 px-4 py-3 text-meta text-success-700">Saved.</p>
      ) : null}
      <Section title="Programme details">
        <ProgramForm action={hodUpdateProgram.bind(null, program.id)} program={program} />
      </Section>
    </div>
  );
}
