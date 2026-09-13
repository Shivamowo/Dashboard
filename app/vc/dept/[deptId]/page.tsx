import { notFound } from "next/navigation";
import { joinMeta } from "@/components/cells";
import { departmentById, departments, hodSubmissionOf } from "@/data";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PageHeading, StatusBadge } from "@/components/ui";

export function generateStaticParams() {
  return departments.map((d) => ({ deptId: d.id }));
}

export default async function VcDeptDetail({ params }: { params: Promise<{ deptId: string }> }) {
  const { deptId } = await params;
  const dept = departmentById(deptId);
  if (!dept) notFound();
  const submission = hodSubmissionOf(dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Vice Chancellor", href: "/vc" },
          { label: dept.shortName },
        ]}
        title={dept.name}
        subtitle={joinMeta([
          dept.facultyOfEngineering,
          dept.hodName ? `Head of Department ${dept.hodName}` : null,
        ])}
        meta={submission ? <StatusBadge status={submission.status} /> : null}
      />
      <DeptDetailSections deptId={dept.id} facultyHrefBase="/vc/faculty" />
    </div>
  );
}
