"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { adminAddFaculty } from "@/lib/actions";
import {
  DESIGNATIONS,
  validateFaculty,
  type FacultyErrors,
  type FacultyInput,
} from "@/lib/data/faculty-schema";

const empty: FacultyInput = {
  name: "",
  employeeId: "",
  designation: "",
  qualification: "",
  specialization: "",
  dateOfJoining: "",
  email: "",
  departments: [],
};

export default function AddFacultyForm({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState<FacultyInput>(empty);
  const [errors, setErrors] = useState<FacultyErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof FacultyInput>(k: K, val: FacultyInput[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggleDept = (id: string) =>
    set("departments", v.departments.includes(id) ? v.departments.filter((d) => d !== id) : [...v.departments, id]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local = validateFaculty(v);
    setErrors(local);
    if (Object.keys(local).length) {
      const first = Object.keys(local)[0];
      document.getElementById(first === "departments" ? "dept-group" : "f-" + first)?.focus();
      return;
    }
    start(async () => {
      const res = await adminAddFaculty(v);
      if (!res.ok) {
        setErrors(res.errors);
        return;
      }
      setToast(`${v.name.trim()} added.`);
      setTimeout(() => router.push(`/admin/faculty/${res.id}`), 900);
    });
  };

  const field = (k: keyof FacultyInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={"f-" + k} className="field-label">
        {label} <span aria-hidden className="text-alert-700">*</span>
      </label>
      <input
        id={"f-" + k}
        className="input mt-1.5"
        value={v[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? "err-" + k : undefined}
        required
        {...props}
      />
      {errors[k] ? (
        <p id={"err-" + k} className="mt-1 text-micro text-alert-700">
          {errors[k]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="panel space-y-5 px-4 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {field("name", "Name")}
        {field("employeeId", "Employee ID")}
        <div>
          <label htmlFor="f-designation" className="field-label">
            Designation <span aria-hidden className="text-alert-700">*</span>
          </label>
          <select
            id="f-designation"
            className="input mt-1.5"
            value={v.designation}
            onChange={(e) => set("designation", e.target.value)}
            aria-invalid={errors.designation ? true : undefined}
            aria-describedby={errors.designation ? "err-designation" : undefined}
            required
          >
            <option value="">Select…</option>
            {DESIGNATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          {errors.designation ? (
            <p id="err-designation" className="mt-1 text-micro text-alert-700">
              {errors.designation}
            </p>
          ) : null}
        </div>
        {field("qualification", "Qualification", { placeholder: "e.g. PhD, M.Tech" })}
        {field("specialization", "Specialization")}
        {field("dateOfJoining", "Date of joining", { type: "date" })}
        {field("email", "Email", { type: "email", autoComplete: "off" })}
      </div>

      <fieldset aria-describedby={errors.departments ? "err-departments" : "dept-hint"}>
        <legend className="field-label">
          Departments <span aria-hidden className="text-alert-700">*</span>
        </legend>
        <p id="dept-hint" className="mt-1 text-micro text-ink-500">
          Select every department this person serves. The first one you tick is the primary department.
        </p>
        <div
          id="dept-group"
          tabIndex={-1}
          className="mt-2 grid max-h-64 grid-cols-1 gap-x-4 gap-y-1 overflow-y-auto rounded-panel border border-ink-200 p-3 sm:grid-cols-2"
        >
          {departments.map((d) => {
            const idx = v.departments.indexOf(d.id);
            return (
              <label key={d.id} className="flex min-h-[2.25rem] cursor-pointer items-start gap-2 py-1 text-meta">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  checked={idx >= 0}
                  onChange={() => toggleDept(d.id)}
                />
                <span className="min-w-0 break-words">
                  {d.name}
                  {idx === 0 ? <span className="ml-1.5 text-micro font-medium text-brand-pink-dark">Primary</span> : null}
                </span>
              </label>
            );
          })}
        </div>
        {errors.departments ? (
          <p id="err-departments" className="mt-1 text-micro text-alert-700">
            {errors.departments}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-4">
        <button type="submit" className="btn-primary" disabled={pending || toast != null}>
          {pending ? "Adding…" : "Add faculty"}
        </button>
        <button type="button" className="btn-quiet" onClick={() => router.push("/admin")} disabled={pending}>
          Cancel
        </button>
        <p className="text-micro text-ink-500">Stored in the demo store for now; a database can replace it later.</p>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-panel border border-success-700 bg-paper-raised px-4 py-3 text-meta shadow-lg"
        >
          <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-success-700" />
          {toast} Opening record…
        </div>
      ) : null}
    </form>
  );
}
