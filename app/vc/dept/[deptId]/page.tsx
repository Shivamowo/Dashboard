import { notFound } from "next/navigation";
import { departmentById, departments, hodSubmissionOf } from "@/data";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PageHeading, StatusBadge } from "@/components/ui";

export function generateStaticParams() {
  return departments.map((d) => ({ deptId: d.id }));
}

export default function VcDeptDetail({ params }: { params: { deptId: string } }) {
  const dept = departmentById(params.deptId);
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
        subtitle={`${dept.facultyOfEngineering} · Head of Department ${dept.hodName}`}
        meta={submission ? <StatusBadge status={submission.status} /> : null}
      />
      <DeptDetailSections deptId={dept.id} facultyHrefBase="/vc/faculty" />
    </div>
  );
}
