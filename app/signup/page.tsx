import Image from "next/image";
import { TriangleAlert } from "lucide-react";

const DEPARTMENTS = [
  { id: "cse", name: "Computer Science & Engineering" },
  { id: "it", name: "Information Technology" },
  { id: "ece", name: "Electronics & Communication Engineering" },
  { id: "me", name: "Mechanical Engineering" },
];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-lg items-center py-8">
      <div className="rounded-panel border border-ink-200 bg-paper-raised px-6 py-7">
        <Image
          src="/vbspu-logo.png"
          alt="Veer Bahadur Singh Purvanchal University seal"
          width={80}
          height={80}
          className="mx-auto mb-5 h-20 w-20"
        />
        <h1 className="text-center font-display text-h3 font-semibold text-ink-900">
          Create your account
        </h1>
        <p className="mb-6 mt-1 text-center text-meta text-ink-500">
          This just creates your account. Once you sign in, you'll fill in the full onboarding
          form before your dashboard becomes active.
        </p>

        {error ? (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {error === "taken"
              ? "That username is already taken — pick another one."
              : "Please fill in every field and try again."}
          </p>
        ) : null}

        <form action="/api/signup" method="post" className="space-y-5">
          <div>
            <p className="field-label mb-2">I am</p>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer rounded-control border border-ink-300 px-3 py-2 text-center text-body font-medium text-ink-700 transition-colors hover:border-ink-400 has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink-50 has-[:checked]:text-brand-pink-dark">
                <input type="radio" name="role" value="faculty" defaultChecked className="sr-only" />
                Faculty
              </label>
              <label className="flex-1 cursor-pointer rounded-control border border-ink-300 px-3 py-2 text-center text-body font-medium text-ink-700 transition-colors hover:border-ink-400 has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink-50 has-[:checked]:text-brand-pink-dark">
                <input type="radio" name="role" value="hod" className="sr-only" />
                Head of Department
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="deptId" className="field-label">
              Department
            </label>
            <select id="deptId" name="deptId" required className="input mt-1.5">
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="field-label">
              Full Name
            </label>
            <input id="name" name="name" type="text" required className="input mt-1.5" />
          </div>

          <div>
            <label htmlFor="username" className="field-label">
              Choose a Username
            </label>
            <input id="username" name="username" type="text" required className="input mt-1.5" />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Choose a Password
            </label>
            <input id="password" name="password" type="password" required className="input mt-1.5" />
          </div>

          <button type="submit" className="btn-primary w-full">
            Create account
          </button>
        </form>

        <p className="mt-6 border-t border-ink-200 pt-4 text-center text-meta text-ink-500">
          Already have an account?{" "}
          <a href="/login" className="btn-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
