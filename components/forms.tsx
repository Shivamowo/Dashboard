import type { ReactNode } from "react";

/**
 * Every field accepts null as well as undefined for its default.
 *
 * Imported records use null for "not reported" (see data/types.ts), and an
 * edit form must show that field as empty and ready to fill, not refuse to
 * render it. React treats null as "no value" on defaultValue/defaultChecked,
 * which is exactly the behaviour wanted, so null is passed straight through
 * rather than being coerced to "" or false — coercing would make an unreported
 * number look like a reported zero the moment the form was saved.
 */

export function TextField({
  name,
  label,
  defaultValue,
  required,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        required={required}
        placeholder={placeholder}
        className="input mt-1.5"
      />
    </div>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  required,
  min = 0,
  step,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  required?: boolean;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue ?? undefined}
        required={required}
        min={min}
        step={step}
        className="input mt-1.5"
      />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  rows = 3,
  span = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? undefined}
        required={required}
        rows={rows}
        className="input mt-1.5"
      />
    </div>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue ?? undefined} required={required} className="input mt-1.5">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean | null;
}) {
  return (
    <label className="flex items-center gap-2 pt-6 text-body text-ink-800">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked ?? false}
        className="h-4 w-4 rounded border-ink-300 text-brand-pink focus:ring-brand-pink"
      />
      {label}
    </label>
  );
}

export function FormGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={"grid grid-cols-1 gap-x-6 gap-y-4 " + map[cols]}>{children}</div>;
}

export function FormActions({ submitLabel = "Submit for approval" }: { submitLabel?: string }) {
  return (
    <div className="flex justify-end border-t border-ink-200 pt-4">
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </div>
  );
}
