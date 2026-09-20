import { notFound } from "next/navigation";
import { departmentById, faculty, facultyById } from "@/data";
import { deptNamesOf } from "@/lib/rows";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, PageHeading } from "@/components/ui";

export function generateStaticParams() {
  return faculty.map((f) => ({ facultyId: f.id }));
}

export default async function VcFacultyProfile({ params }: { params: Promise<{ facultyId: string }> }) {
  const { facultyId } = await params;
  const f = facultyById(facultyId);
  if (!f) notFound();
  const dept = departmentById(f.primaryDepartment);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Vice Chancellor", href: "/vc" },
          { label: dept?.shortName ?? f.primaryDepartment, href: `/vc/dept/${f.primaryDepartment}` },
          { label: f.name },
        ]}
        title={f.name}
        subtitle={`${f.designation} · ${deptNamesOf(f)}`}
        meta={<Badge tone="seal">{f.appointmentType}</Badge>}
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
