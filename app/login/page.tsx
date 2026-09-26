import type { Metadata } from "next";
import Image from "next/image";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in — Department Records",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  const failed = error === "1";
  // Set when a session cookie outlived the account it named — see lib/session.ts.
  const expired = error === "expired";
  return (
    <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl items-center gap-12 py-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <h1 className="font-display text-h1 font-semibold leading-tight text-ink-900">
          Department Records
        </h1>
        <p className="mt-3 max-w-[48ch] text-lead text-ink-600">
          Veer Bahadur Singh Purvanchal University, Jaunpur. Sign in to open the records your
          office is responsible for.
        </p>

        <div className="mt-8 rounded-panel border border-ink-200 bg-paper-raised px-5 py-5">
          <h2 className="font-display text-lead font-semibold text-ink-900">Demonstration accounts</h2>
          <p className="mt-1 text-meta text-ink-500">
            This build ships with fixed sample accounts. Every one uses the password{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 text-micro text-ink-800">demo123</code>.
          </p>
          <ul className="mt-4 divide-y divide-ink-200 border-t border-ink-200">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.username} className="flex items-baseline justify-between gap-4 py-2.5">
                <code className="text-meta text-ink-800">{a.username}</code>
                <span className="text-micro text-ink-500">{a.displayName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-panel border border-ink-200 bg-paper-raised px-6 py-7">
        {/* University seal, ~96px, centred above the form (design.md §3). */}
        <Image
          src="/vbspu-logo.png"
          alt="Veer Bahadur Singh Purvanchal University seal"
          width={96}
          height={96}
          priority
          className="mx-auto mb-5 h-24 w-24"
        />
        <h2 className="text-center font-display text-h3 font-semibold text-ink-900">Sign in</h2>
        <p className="mb-6 mt-1 text-center text-meta text-ink-500">
          Your role decides which records open, and it cannot be changed after signing in.
        </p>
        <form action="/api/login" method="post" className="space-y-4">
          <div>
            <label htmlFor="username" className="field-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="input mt-1.5"
              placeholder="vc-demo"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input mt-1.5"
            />
          </div>

          {failed || expired ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700"
            >
              <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {expired
                ? "Your session has ended because the server restarted. Accounts created by signing up do not survive a restart in this demo build — sign in with one of the accounts listed here."
                : "That username and password combination is not recognised. Pick an account from the list and use the password demo123."}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-meta text-ink-600">
          New faculty or HoD?{" "}
          <a href="/signup" className="btn-link">
            Sign up
          </a>
        </p>

        <p className="mt-6 border-t border-ink-200 pt-4 text-micro leading-relaxed text-ink-500">
          Demonstration build with mock authentication — credentials are held in source, nothing is
          hashed and no session is stored on a server.
        </p>
      </div>
    </div>
  );
}
