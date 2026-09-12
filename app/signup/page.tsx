"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";

const DEPARTMENTS = [
  { id: "cse", name: "Computer Science & Engineering" },
  { id: "it", name: "Information Technology" },
  { id: "ece", name: "Electronics & Communication Engineering" },
  { id: "me", name: "Mechanical Engineering" },
];

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"];
const APPOINTMENT_TYPES = ["Regular", "Contractual", "Self-Financing", "Guest"];

function SignupForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const [role, setRole] = useState<"faculty" | "hod">("faculty");

  return (
    <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-3xl items-center py-8">
      <div className="rounded-panel border border-ink-200 bg-paper-raised px-6 py-7">
        <Image
          src="/vbspu-logo.png"
          alt="Veer Bahadur Singh Purvanchal University seal"
          width={80}
          height={80}
          className="mx-auto mb-5 h-20 w-20"
        />
        <h1 className="text-center font-display text-h3 font-semibold text-ink-900">
          Faculty / HoD sign up
        </h1>
        <p className="mb-6 mt-1 text-center text-meta text-ink-500">
          Your account is created immediately, but your record stays pending until an Administrator
          approves your onboarding.
        </p>

        {error ? (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {error === "taken"
              ? "That username is already taken — pick another one."
              : "Please fill in every required field and try again."}
          </p>
        ) : null}

        <form action="/api/signup" method="post" className="space-y-5">
          <div>
            <p className="field-label mb-2">I am signing up as</p>
            <div className="flex gap-2">
              {(["faculty", "hod"] as const).map((r) => (
                <label
                  key={r}
                  className={
                    "flex-1 cursor-pointer rounded-control border px-3 py-2 text-center text-body font-medium transition-colors " +
                    (role === r
                      ? "border-brand-pink bg-brand-pink-50 text-brand-pink-dark"
                      : "border-ink-300 text-ink-700 hover:border-ink-400")
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="sr-only"
                  />
                  {r === "faculty" ? "Faculty" : "Head of Department"}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          {role === "hod" ? (
            <div>
              <label htmlFor="mobileContact" className="field-label">
                Mobile / Contact No.
              </label>
              <input id="mobileContact" name="mobileContact" type="text" required className="input mt-1.5" />
            </div>
          ) : (
            <div className="space-y-4 border-t border-ink-200 pt-4">
              <p className="field-label">Faculty appointment details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="designation" className="field-label">
                    Designation
                  </label>
                  <select id="designation" name="designation" required className="input mt-1.5">
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="appointmentType" className="field-label">
                    Appointment Type
                  </label>
                  <select id="appointmentType" name="appointmentType" required className="input mt-1.5">
                    {APPOINTMENT_TYPES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dateOfJoining" className="field-label">
                    Date of Joining
                  </label>
                  <input id="dateOfJoining" name="dateOfJoining" type="text" placeholder="DD/MM/YYYY" required className="input mt-1.5" />
                </div>
                <div>
                  <label htmlFor="teachingLoadHrsPerWeek" className="field-label">
                    Teaching Load (Hrs/Week)
                  </label>
                  <input id="teachingLoadHrsPerWeek" name="teachingLoadHrsPerWeek" type="number" min={0} required className="input mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="programmesAppointedFor" className="field-label">
                    Programme(s) for which Appointed
                  </label>
                  <input id="programmesAppointedFor" name="programmesAppointedFor" type="text" required className="input mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="additionalResponsibility" className="field-label">
                    Additional Responsibility
                  </label>
                  <input id="additionalResponsibility" name="additionalResponsibility" type="text" placeholder="NA" className="input mt-1.5" />
                </div>
                <label className="flex items-center gap-2 text-body text-ink-800 sm:col-span-2">
                  <input type="checkbox" name="hasPhd" className="h-4 w-4 rounded border-ink-300 text-brand-pink focus:ring-brand-pink" />
                  Holds a PhD
                </label>
              </div>
            </div>
          )}

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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
