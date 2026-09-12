import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        crumbs={[{ label: "Roles", href: "/" }, { label: "Page not found" }]}
        title="That page is not here"
      />
      <EmptyState
        icon={FileQuestion}
        title="No record at this address"
        message="The link may be out of date, or the record may have been filed under a different department."
        action={
          <Link href="/" className="btn-link">
            Back to role selection
          </Link>
        }
      />
    </div>
  );
}
