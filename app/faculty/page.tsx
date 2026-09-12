import { CURRENT_FACULTY_ID, departmentById, facultyById } from "@/data";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, PageHeading } from "@/components/ui";

export default function FacultySelfView() {
  const f = facultyById(CURRENT_FACULTY_ID)!;
  const dept = departmentById(f.deptId);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Roles", href: "/" }, { label: "My record" }]}
        title={f.name}
        subtitle={`${f.designation} · ${dept?.name ?? ""}. This view shows your own record only.`}
        meta={<Badge tone="seal">{f.appointmentType}</Badge>}
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
