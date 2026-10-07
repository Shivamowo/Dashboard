"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, TriangleAlert } from "lucide-react";
import { hodCreateFaculty, type HodCreateFacultyResult } from "@/lib/actions";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Guest Faculty"] as const;
const APPOINTMENTS = ["Regular", "Contractual", "Self-Financing", "Guest"] as const;

/**
 * HoD "Add faculty": ONLY the fields the HoD workbook's Faculty Details sheet
 * held. Saving also creates the faculty login (email + temporary password),
 * shown once below for the HoD to pass on.
 */
export default function HodAddFacultyForm({ deptName }: { deptName: string }) {
  const [result, setResult] = useState<HodCreateFacultyResult | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const res = await hodCreateFaculty(data);
      setResult(res);
      if (res.ok) form.reset();
    });
  };

  if (result?.ok) {
    const creds = "email" in result ? `Email: ${result.email}\nPassword: ${result.password}` : null;
    return (
      <div className="panel space-y-4 px-4 py-5 sm:px-6">
        <p className="flex items-center gap-2 font-medium text-success-700">
          <CheckCircle2 aria-hidden className="h-5 w-5" />
          {result.name} added to {deptName}.
        </p>
        {creds ? (
          <div className="rounded-panel border border-ink-200 bg-paper px-4 py-3">
            <p className="field-label mb-2">Login created — shown once, copy it now</p>
            <pre className="whitespace-pre-wrap break-all text-body text-ink-900">{creds}</pre>
            <button
              type="button"
              className="btn-quiet mt-3"
              onClick={() => {
                navigator.clipboard?.writeText(creds).then(() => setCopied(true));
              }}
            >
              <Copy aria-hidden className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            <p className="mt-3 text-micro text-ink-500">
              They must set a new password at first sign-in. Faculty sign-in is switched off for now, so this login
              will work once it is turned back on.
            </p>
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            The record was saved but the login could not be created ({"accountError" in result ? result.accountError : "unknown error"}). Ask Admin to create it.
          </p>
        )}
        <div className="flex flex-wrap gap-3 border-t border-ink-200 pt-4">
          <Link href={`/hod/faculty/${result.facultyId}/edit`} className="btn-primary">
            Fill in research, projects & targets
          </Link>
          <button type="button" className="btn-quiet" onClick={() => { setResult(null); setCopied(false); }}>
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel space-y-5 px-4 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">Name of Faculty Member <span aria-hidden className="text-alert-700">*</span></label>
          <input id="name" name="name" required className="input mt-1.5" />
        </div>
        <div>
          <label htmlFor="designation" className="field-label">Designation <span aria-hidden className="text-alert-700">*</span></label>
          <select id="designation" name="designation" required defaultValue="" className="input mt-1.5">
            <option value="">Select…</option>
            {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="appointmentType" className="field-label">Appointment Type</label>
          <select id="appointmentType" name="appointmentType" defaultValue="" className="input mt-1.5">
            <option value="">Not provided</option>
            {APPOINTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dateOfJoining" className="field-label">Date of Joining</label>
          <input id="dateOfJoining" name="dateOfJoining" type="date" className="input mt-1.5" />
        </div>
        <div>
          <label htmlFor="hasPhd" className="field-label">Holds a PhD</label>
          <select id="hasPhd" name="hasPhd" defaultValue="" className="input mt-1.5">
            <option value="">Not provided</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="teachingLoadHrsPerWeek" className="field-label">Teaching Load (Hrs/Week)</label>
          <input id="teachingLoadHrsPerWeek" name="teachingLoadHrsPerWeek" type="number" min={0} className="input mt-1.5" />
        </div>
        <div>
          <label htmlFor="programmesAppointedFor" className="field-label">Programme(s) for which Appointed</label>
          <input id="programmesAppointedFor" name="programmesAppointedFor" className="input mt-1.5" />
        </div>
        <div>
          <label htmlFor="additionalResponsibility" className="field-label">Additional Responsibility</label>
          <input id="additionalResponsibility" name="additionalResponsibility" className="input mt-1.5" />
        </div>
      </div>

      {result && !result.ok ? (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-alert-100 bg-alert-50 px-3 py-2.5 text-meta text-alert-700">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {result.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add faculty & create login"}
        </button>
        <p className="text-micro text-ink-500">
          Added to {deptName}. An email and temporary password are generated automatically.
        </p>
      </div>
    </form>
  );
}
