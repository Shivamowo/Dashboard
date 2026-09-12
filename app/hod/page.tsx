import { CURRENT_HOD_DEPT_ID, departmentById, hodSubmissionOf } from "@/data";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PageHeading, StatusBadge } from "@/components/ui";

export default function HodDashboard() {
  const dept = departmentById(CURRENT_HOD_DEPT_ID)!;
  const submission = hodSubmissionOf(dept.id);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Roles", href: "/" }, { label: `Head of Department · ${dept.shortName}` }]}
        title={dept.name}
        subtitle={`Signed in as ${dept.hodName}. You see this department only.`}
        meta={submission ? <StatusBadge status={submission.status} /> : null}
      />
      <DeptDetailSections deptId={dept.id} facultyHrefBase="/hod/faculty" />
    </div>
  );
}
