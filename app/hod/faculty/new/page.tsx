import { departments } from "@/data";
import { requireSessionUser } from "@/lib/session";
import AddFacultyForm from "@/components/AddFacultyForm";
import { PageHeading } from "@/components/ui";

export default async function HodAddFacultyPage() {
  const user = await requireSessionUser();
  const dept = departments.find((d) => d.id === user.deptId);
  return (
    <div>
      <PageHeading
        crumbs={[{ label: `Head of Department · ${dept?.shortName ?? ""}`, href: "/hod" }, { label: "Add faculty" }]}
        title="Add faculty"
        subtitle="Create a record for a faculty member who is missing from your department."
      />
      <div className="max-w-3xl">
        <AddFacultyForm
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          hodDeptId={user.deptId}
        />
      </div>
    </div>
  );
}
