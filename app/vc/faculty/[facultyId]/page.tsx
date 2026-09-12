import { notFound } from "next/navigation";
import { departmentById, faculty, facultyById } from "@/data";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { Badge, PageHeading } from "@/components/ui";

export function generateStaticParams() {
  return faculty.map((f) => ({ facultyId: f.id }));
}

export default function VcFacultyProfile({ params }: { params: { facultyId: string } }) {
  const f = facultyById(params.facultyId);
  if (!f) notFound();
  const dept = departmentById(f.deptId);

  return (
    <div>
      <PageHeading
        crumbs={[
          { label: "Vice Chancellor", href: "/vc" },
          { label: dept?.shortName ?? f.deptId, href: `/vc/dept/${f.deptId}` },
          { label: f.name },
        ]}
        title={f.name}
        subtitle={`${f.designation} · ${dept?.name ?? ""}`}
        meta={<Badge tone="seal">{f.appointmentType}</Badge>}
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
