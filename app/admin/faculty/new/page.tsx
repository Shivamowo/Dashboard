import { departments } from "@/data";
import AddFacultyForm from "@/components/AddFacultyForm";
import { PageHeading } from "@/components/ui";

export default function AddFacultyPage() {
  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator", href: "/admin" }, { label: "Faculty", href: "/admin/faculty" }, { label: "Add faculty" }]}
        title="Add faculty"
        subtitle="Create a faculty record and assign it to one or more departments."
      />
      <div className="max-w-3xl">
        <AddFacultyForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>
    </div>
  );
}
