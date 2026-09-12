import type { ReactNode } from "react";

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
  defaultValue?: string | number;
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
        defaultValue={defaultValue}
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
  defaultValue?: number;
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
        defaultValue={defaultValue}
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
  defaultValue?: string;
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
        defaultValue={defaultValue}
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
  defaultValue?: string;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} required={required} className="input mt-1.5">
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
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 pt-6 text-body text-ink-800">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
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
