import Link from "next/link";
import { Pencil } from "lucide-react";
import { departmentById, hodSubmissionOf, latestOnboardingForUser } from "@/data";
import { requireSessionUser } from "@/lib/session";
import DeptDetailSections from "@/components/DeptDetailSections";
import { PendingRequestNotice } from "@/components/PendingNotice";
import { PageHeading, StatusBadge } from "@/components/ui";

export default async function HodDashboard() {
  const user = await requireSessionUser();
  const dept = departmentById(user.deptId!)!;
  const submission = hodSubmissionOf(dept.id);
  // Middleware sends "onboarding_incomplete" accounts to /hod/onboarding —
  // reaching here while "pending_approval" means it's awaiting Admin review.
  const onboarding = user.status === "pending_approval" ? latestOnboardingForUser(user.id) : undefined;

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

      {onboarding ? (
        <div className="mb-6">
          <PendingRequestNotice cr={onboarding} title="Your onboarding as HoD" />
        </div>
      ) : null}

      <DeptDetailSections deptId={dept.id} facultyHrefBase="/hod/faculty" facultyEditHrefBase="/hod/faculty" />
    </div>
  );
}
