import { notFound } from "next/navigation";
import { departmentById, departments, hodSubmissionOf } from "@/data";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PageHeading, StatusBadge } from "@/components/ui";

export function generateStaticParams() {
  return departments.map((d) => ({ deptId: d.id }));
}

export default function RegistrarDeptDetail({ params }: { params: { deptId: string } }) {
  const dept = departmentById(params.deptId);
  if (!dept) notFound();
  const submission = hodSubmissionOf(dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Registrar", href: "/registrar" },
          { label: dept.shortName },
        ]}
        title={dept.name}
        subtitle={`${dept.facultyOfEngineering} · Head of Department ${dept.hodName}`}
        meta={submission ? <StatusBadge status={submission.status} /> : null}
      />
      <DeptDetailSections deptId={dept.id} facultyHrefBase="/registrar/faculty" />
    </div>
  );
}
