import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { departmentById, facultyById, pendingFacultyEditIds } from "@/data";
import { deptNamesOf } from "@/lib/rows";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, PageHeading, PendingBadge } from "@/components/ui";

export default async function AdminFacultyProfile({ params }: { params: Promise<{ facultyId: string }> }) {
  const { facultyId } = await params;
  const f = facultyById(facultyId);
  if (!f) notFound();
  const dept = departmentById(f.primaryDepartment);
  const pending = pendingFacultyEditIds().has(f.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Administrator", href: "/admin" },
          { label: dept?.shortName ?? f.primaryDepartment, href: `/admin/dept/${f.primaryDepartment}` },
          { label: f.name },
        ]}
        title={f.name}
        subtitle={`${f.designation} · ${deptNamesOf(f)}`}
        meta={
          <span className="flex items-center gap-2">
            <Badge tone="seal">{f.appointmentType}</Badge>
            {pending ? <PendingBadge /> : null}
            <Link href={`/admin/faculty/${f.id}/edit`} className="btn-quiet">
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
