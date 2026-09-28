"use client";

import { useState, useTransition } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { changeOwnPassword } from "@/lib/actions";

const MIN_LENGTH = 8;

export default function AccountPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const validate = (): string | null => {
    if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    setClientError(error);
    setServerError(null);
    if (error) return;

    const form = new FormData();
    form.set("password", password);
    form.set("confirmPassword", confirmPassword);
    startTransition(async () => {
      const result = await changeOwnPassword(form);
      // A successful change redirects server-side (throws NEXT_REDIRECT), so
      // reaching here means it did not — surface the reason.
      if (!result.ok) setServerError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="field-label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-1.5"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="field-label">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input mt-1.5"
        />
      </div>

      {clientError || serverError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700"
        >
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {clientError ?? serverError}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-control border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-meta text-emerald-700"
        >
          <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Password updated. Taking you to your dashboard…
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
