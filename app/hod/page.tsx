import Link from "next/link";
import { Pencil } from "lucide-react";
import { departmentById, hodSubmissionOf, latestOnboardingForUser } from "@/data";
import { getSessionUser } from "@/lib/session";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PendingRequestNotice, RejectedRequestNotice } from "@/components/PendingNotice";
import { PageHeading, StatusBadge } from "@/components/ui";

export default async function HodDashboard() {
  const user = (await getSessionUser())!;
  const dept = departmentById(user.deptId!)!;
  const submission = hodSubmissionOf(dept.id);
  const onboarding = user.status !== "active" ? latestOnboardingForUser(user.id) : undefined;

  return (
    <div>
      <PageHeading
        crumbs={[{ label: `Head of Department · ${dept.shortName}` }]}
        title={dept.name}
        subtitle={`Signed in as ${user.displayName}. You see this department only.`}
        meta={
          <span className="flex items-center gap-2">
            {submission ? <StatusBadge status={submission.status} /> : null}
            <Link href="/hod/edit" className="btn-quiet">
              <Pencil aria-hidden className="h-3.5 w-3.5" />
              Edit my submission
            </Link>
          </span>
        }
      />

      {user.status === "pending" && onboarding ? (
        <div className="mb-6">
          <PendingRequestNotice cr={onboarding} title="Your onboarding as HoD" />
        </div>
      ) : null}
      {user.status === "rejected" && onboarding ? (
        <div className="mb-6">
          <RejectedRequestNotice cr={onboarding} title="Your onboarding as HoD" />
        </div>
      ) : null}

      <DeptDetailSections deptId={dept.id} facultyHrefBase="/hod/faculty" facultyEditHrefBase="/hod/faculty" />
    </div>
  );
}
