import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        crumbs={[{ label: "Page not found" }]}
        title="That page is not here"
      />
      <EmptyState
        icon={FileQuestion}
        title="No record at this address"
        message="The link may be out of date, or the record may have been filed under a different department."
        action={
          <Link href="/login" className="btn-link">
            Back to sign in
          </Link>
        }
      />
    </div>
  );
}
