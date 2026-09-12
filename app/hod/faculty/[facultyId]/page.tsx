import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { CURRENT_HOD_DEPT_ID, departmentById, facultyByDept, facultyById } from "@/data";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, EmptyState, PageHeading } from "@/components/ui";

export function generateStaticParams() {
  return facultyByDept(CURRENT_HOD_DEPT_ID).map((f) => ({ facultyId: f.id }));
}

export default function HodFacultyProfile({ params }: { params: { facultyId: string } }) {
  const f = facultyById(params.facultyId);
  if (!f) notFound();

  const dept = departmentById(CURRENT_HOD_DEPT_ID)!;
  const crumbRoot = [
    { label: `Head of Department · ${dept.shortName}`, href: "/hod" },
  ];

  // A head of department sees only their own department's records.
  if (f.deptId !== CURRENT_HOD_DEPT_ID) {
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

  return (
    <div>
      <PageHeading
        crumbs={[...crumbRoot, { label: f.name }]}
        title={f.name}
        subtitle={`${f.designation} · ${dept.name}`}
        meta={<Badge tone="seal">{f.appointmentType}</Badge>}
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
