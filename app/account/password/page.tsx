import type { Metadata } from "next";
import { requireSessionUser } from "@/lib/session";
import { PageHeading } from "@/components/ui";
import AccountPasswordForm from "@/components/AccountPasswordForm";

export const metadata: Metadata = {
  title: "Change password — Department Records",
};

export default async function AccountPasswordPage() {
  const user = await requireSessionUser();

  return (
    <div className="mx-auto max-w-md">
      <PageHeading
        crumbs={[{ label: "Account settings" }]}
        title={user.mustChangePassword ? "Set a new password" : "Change your password"}
      />
      {user.mustChangePassword ? (
        <p className="mb-5 text-meta text-ink-600">
          You're signed in with a temporary password. Set your own before continuing to your dashboard.
        </p>
      ) : null}
      <div className="rounded-panel border border-ink-200 bg-paper-raised px-6 py-7">
        <AccountPasswordForm />
      </div>
    </div>
  );
}
