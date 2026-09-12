import Link from "next/link";
import { Pencil } from "lucide-react";
import { departmentById, facultyById, latestOnboardingForUser } from "@/data";
import { getSessionUser } from "@/lib/session";
import FacultyProfileSections from "@/components/FacultyProfileSections";
import { PendingRequestNotice } from "@/components/PendingNotice";
import { Badge, PageHeading } from "@/components/ui";

export default async function FacultySelfView() {
  const user = (await getSessionUser())!;

  // Middleware sends "onboarding_incomplete" accounts to /faculty/onboarding —
  // reaching here with no facultyId means onboarding was submitted and is
  // awaiting Admin approval.
  if (!user.facultyId) {
    const onboarding = latestOnboardingForUser(user.id);
    return (
      <div>
        <PageHeading crumbs={[{ label: "My record" }]} title={user.displayName} />
        {onboarding ? <PendingRequestNotice cr={onboarding} title="Your onboarding" /> : null}
      </div>
    );
  }

  const f = facultyById(user.facultyId)!;
  const dept = departmentById(f.deptId);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "My record" }]}
        title={f.name}
        subtitle={`${f.designation} · ${dept?.name ?? ""}. This view shows your own record only.`}
        meta={
          <span className="flex items-center gap-2">
            <Badge tone="seal">{f.appointmentType}</Badge>
            <Link href="/faculty/edit" className="btn-quiet">
              <Pencil aria-hidden className="h-3.5 w-3.5" />
              Edit my record
            </Link>
          </span>
        }
      />
      <FacultyProfileSections facultyId={f.id} />
    </div>
  );
}
