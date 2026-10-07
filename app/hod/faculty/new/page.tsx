import { departmentById } from "@/data";
import { requireSessionUser } from "@/lib/session";
import HodAddFacultyForm from "@/components/HodAddFacultyForm";
import { PageHeading } from "@/components/ui";

export default async function HodAddFacultyPage() {
  const user = await requireSessionUser();
  const dept = departmentById(user.deptId!)!;
  return (
    <div>
      <PageHeading
        crumbs={[{ label: `Head of Department · ${dept.shortName}`, href: "/hod" }, { label: "Add faculty" }]}
        title="Add faculty"
        subtitle="Enter the details the department sheet used to hold. A login is created automatically."
      />
      <div className="max-w-3xl">
        <HodAddFacultyForm deptName={dept.name} />
      </div>
    </div>
  );
}
