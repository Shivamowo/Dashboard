import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Pencil } from "lucide-react";
import { departmentById, facultyById, pendingFacultyEditIds } from "@/data";
import { getSessionUser } from "@/lib/session";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, EmptyState, PageHeading, PendingBadge } from "@/components/ui";

export default async function HodFacultyProfile({ params }: { params: Promise<{ facultyId: string }> }) {
  const { facultyId } = await params;
  const user = (await getSessionUser())!;
  const f = facultyById(facultyId);
  if (!f) notFound();

  const dept = departmentById(user.deptId!)!;
  const crumbRoot = [
    { label: `Head of Department · ${dept.shortName}`, href: "/hod" },
  ];

  // A head of department sees only their own department's records.
  if (f.deptId !== user.deptId) {
    return (
      <div>
        <PageHeading
          crumbs={[...crumbRoot, { label: "Record unavailable" }]}
          title="Outside your department"
        />
        <EmptyState
          icon={Lock}
          title="This record belongs to another department"
          message={`As head of ${dept.name} you can open records for your own faculty. Ask the Registrar for anything beyond it.`}
        />
      </div>
    );
  }

  const pending = pendingFacultyEditIds().has(f.id);

  return (
    <div>
      <PageHeading
        crumbs={[...crumbRoot, { label: f.name }]}
        title={f.name}
        subtitle={`${f.designation} · ${dept.name}`}
        meta={
          <span className="flex items-center gap-2">
            <Badge tone="seal">{f.appointmentType}</Badge>
            {pending ? <PendingBadge /> : null}
            <Link href={`/hod/faculty/${f.id}/edit`} className="btn-quiet">
              <Pencil aria-hidden className="h-3.5 w-3.5" />
              Edit
            </Link>
          </span>
        }
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
