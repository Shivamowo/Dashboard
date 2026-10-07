import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { departmentById, programsByDept } from "@/data";
import { requireSessionUser } from "@/lib/session";
import { PageHeading, Section, Value } from "@/components/ui";

export default async function HodProgramsPage() {
  const user = await requireSessionUser();
  const dept = departmentById(user.deptId!)!;
  const programs = programsByDept(dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: `Head of Department · ${dept.shortName}`, href: "/hod" }, { label: "Programmes" }]}
        title="Programmes, intake & admissions"
        subtitle="Edit any programme, or add a new one. Changes are saved immediately."
        meta={
          <Link href="/hod/programs/new" className="btn-quiet">
            <Plus aria-hidden className="h-3.5 w-3.5" />
            Add programme
          </Link>
        }
      />
      <Section title="Programmes" description="Intake against admissions for the latest year is shown for quick checking.">
        <div className="divide-y divide-ink-200">
          {programs.length === 0 ? <p className="py-4 text-meta text-ink-500">No programmes on record yet.</p> : null}
          {programs.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="break-words font-medium text-ink-900">{p.name}</p>
                <p className="text-meta text-ink-500">
                  Intake 2026: <Value value={p.sanctionedIntakeByYear.y2026} /> · Admitted 2026: <Value value={p.admittedByYear.y2026} />
                </p>
              </div>
              <Link href={`/hod/programs/${p.id}/edit`} className="btn-quiet">
                <Pencil aria-hidden className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
