import { notFound } from "next/navigation";
import { joinMeta } from "@/components/cells";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { departmentById, hodSubmissionOf } from "@/data";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PageHeading, StatusBadge } from "@/components/ui";

export default async function AdminDeptDetail({ params }: { params: Promise<{ deptId: string }> }) {
  const { deptId } = await params;
  const dept = departmentById(deptId);
  if (!dept) notFound();
  const submission = hodSubmissionOf(dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator", href: "/admin" }, { label: dept.shortName }]}
        title={dept.name}
        subtitle={joinMeta([
          dept.facultyOfEngineering,
          dept.hodName ? `Head of Department ${dept.hodName}` : null,
        ])}
        meta={
          <span className="flex items-center gap-2">
            {submission ? <StatusBadge status={submission.status} /> : null}
            <Link href={`/admin/dept/${dept.id}/edit`} className="btn-quiet">
              <Pencil aria-hidden className="h-3.5 w-3.5" />
              Edit department
            </Link>
          </span>
        }
      />
      <DeptDetailSections
        deptId={dept.id}
        facultyHrefBase="/admin/faculty"
        facultyEditHrefBase="/admin/faculty"
        infraEditHrefBase="/admin/infra"
        hodEditHref={`/admin/dept/${dept.id}/edit`}
      />
    </div>
  );
}
