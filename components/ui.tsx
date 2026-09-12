import Link from "next/link";
import { ChevronRight, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { QuarterStatus } from "@/data";

/* ------------------------------------------------------------------ KpiCard */

type Tone = "neutral" | "seal" | "positive" | "caution" | "alert";

const valueTone: Record<Tone, string> = {
  neutral: "text-ink-900",
  seal: "text-brand-pink-dark",
  positive: "text-success-700",
  caution: "text-caution-700",
  alert: "text-alert-700",
};

export function KpiCard({
  label,
  value,
  unit,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className="panel flex flex-col justify-between gap-3 px-4 py-4 transition-colors hover:border-ink-300">
      <div className="flex items-start justify-between gap-2">
        <p className="text-micro font-medium text-ink-500">{label}</p>
        {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0 text-ink-300" /> : null}
      </div>
      <div>
        <p className={"font-display text-h2 font-semibold leading-none tnum " + valueTone[tone]}>
          {value}
          {unit ? <span className="ml-1 text-lead font-medium text-ink-500">{unit}</span> : null}
        </p>
        {hint ? <p className="mt-2 text-micro leading-snug text-ink-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{children}</div>
  );
}

/* -------------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  label,
  showValue = true,
  srLabel,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  srLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill =
    pct >= 75
      ? "bg-success-600"
      : pct >= 50
      ? "bg-brand-pink"
      : pct >= 30
      ? "bg-caution-600"
      : "bg-alert-600";

  return (
    <div className="w-full min-w-[7rem]">
      {label ? <p className="field-label mb-1.5">{label}</p> : null}
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={srLabel ?? label ?? "Progress"}
          className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200"
        >
          <div className={"h-full rounded-full " + fill} style={{ width: pct + "%" }} />
        </div>
        {showValue ? (
          <span className="w-9 shrink-0 text-right text-micro font-semibold tnum text-ink-700">
            {pct}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- StatusBadge */

type BadgeTone =
  | "positive"
  | "seal"
  | "caution"
  | "alert"
  | "neutral"
  | "gold"
  /**
   * Brand priority tone (brand-maroon). Deliberately kept distinct from the
   * system "alert" red used by the Delayed status — see design.md §6. Both
   * always carry their text label, never colour alone.
   */
  | "priority";

const badgeTone: Record<BadgeTone, string> = {
  positive: "bg-success-50 text-success-700 ring-success-600/25",
  seal: "bg-brand-pink-50 text-brand-pink-dark ring-brand-pink/30",
  caution: "bg-caution-50 text-caution-700 ring-caution-600/25",
  alert: "bg-alert-50 text-alert-700 ring-alert-600/25",
  gold: "bg-brand-gold-50 text-ink-800 ring-brand-gold/50",
  priority: "bg-brand-maroon-50 text-brand-maroon ring-brand-maroon/30",
  neutral: "bg-ink-100 text-ink-700 ring-ink-300",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium ring-1 ring-inset " +
        badgeTone[tone]
      }
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  Completed: "positive",
  "On track": "seal",
  "At risk": "caution",
  Delayed: "alert",
  Submitted: "positive",
  Pending: "alert",
  Partial: "caution",
  Ongoing: "seal",
  Sanctioned: "positive",
  Closed: "neutral",
  // HoD priority — brand-maroon for High, so it never reads as the system
  // "Delayed" red sitting beside it in the targets tracker.
  High: "priority",
  Medium: "seal",
  Low: "gold",
  "Under-utilised": "caution",
  Optimal: "positive",
  "Over-utilised": "alert",
};

/**
 * Status is never carried by colour alone — the badge always shows its label,
 * and a leading dot gives a second, non-colour cue at a glance.
 */
export function StatusBadge({ status }: { status: QuarterStatus | string }) {
  const tone = statusTone[status] ?? "neutral";
  const dot: Record<BadgeTone, string> = {
    positive: "bg-success-600",
    seal: "bg-brand-pink",
    caution: "bg-caution-600",
    alert: "bg-alert-600",
    gold: "bg-brand-gold",
    priority: "bg-brand-maroon",
    neutral: "bg-ink-400",
  };
  return (
    <Badge tone={tone}>
      <span aria-hidden className={"h-1.5 w-1.5 rounded-full " + dot[tone]} />
      {status}
    </Badge>
  );
}

export function BoolBadge({ value, yes = "Yes", no = "No" }: { value: boolean; yes?: string; no?: string }) {
  return value ? (
    <Badge tone="positive">{yes}</Badge>
  ) : (
    <span className="text-ink-400">{no}</span>
  );
}

/* --------------------------------------------------------------- Breadcrumb */

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-micro text-ink-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label + i} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-control px-1 py-0.5 transition-colors hover:bg-ink-100 hover:text-brand-pink-dark"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "px-1 py-0.5 font-medium text-ink-700" : "px-1 py-0.5"}>
                  {item.label}
                </span>
              )}
              {!last ? (
                <ChevronRight aria-hidden className="h-3 w-3 shrink-0 text-ink-300" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------- PageHeading */

/**
 * The breadcrumb is part of the page header block, not a floating strip — it
 * sits directly above the title it belongs to, inside the same bordered header.
 */
export function PageHeading({
  title,
  subtitle,
  crumbs,
  meta,
}: {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  meta?: ReactNode;
}) {
  return (
    <header className="mb-7 border-b border-ink-200 pb-5">
      {crumbs ? (
        <div className="mb-3">
          <Breadcrumb items={crumbs} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-h1 font-semibold text-ink-900">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-[72ch] text-lead text-ink-600">{subtitle}</p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ Section */

export function Section({
  id,
  title,
  description,
  actions,
  children,
  icon: Icon,
  accent = "pink",
}: {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  icon?: LucideIcon;
  /** "teal" ties the infrastructure/ET sections to the seal water motif. */
  accent?: "pink" | "teal";
}) {
  return (
    <section id={id} className="panel scroll-mt-6">
      <div className="panel-head">
        <div className="min-w-0">
          <h2 className="panel-title flex items-center gap-2">
            {Icon ? (
              <Icon
                aria-hidden
                className={
                  "h-4 w-4 shrink-0 " +
                  (accent === "teal" ? "text-brand-teal-dark" : "text-brand-pink-dark")
                }
              />
            ) : null}
            {title}
          </h2>
          {description ? <p className="panel-note">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------- Fields */

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="field-label">{label}</p>
      <div className="field-value break-words">
        {value === "" || value == null ? <span className="text-ink-400">Not reported</span> : value}
      </div>
    </div>
  );
}

export function FieldGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={"grid grid-cols-1 gap-x-6 gap-y-5 " + map[cols]}>{children}</div>;
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <p className="rule-label">{children}</p>;
}

/* -------------------------------------------------------------- ProfileCard */

export function ProfileCard({
  name,
  subtitle,
  badges,
  fields,
  footer,
}: {
  name: string;
  subtitle?: string;
  badges?: ReactNode;
  fields: { label: string; value: ReactNode }[];
  footer?: ReactNode;
}) {
  const initials = name
    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.|Sh\.|Smt\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-ink-200 bg-paper-sunken px-5 py-5 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand-pink-200 bg-brand-pink-50 font-display text-h3 font-semibold text-brand-pink-dark"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="font-display text-h2 font-semibold text-ink-900">{name}</h2>
            {badges}
          </div>
          {subtitle ? <p className="mt-1 text-body text-ink-600">{subtitle}</p> : null}
        </div>
      </div>
      <div className="px-5 py-5">
        <FieldGrid cols={3}>
          {fields.map((f) => (
            <Field key={f.label} label={f.label} value={f.value} />
          ))}
        </FieldGrid>
      </div>
      {footer ? (
        <div className="border-t border-ink-200 px-5 py-3 text-micro text-ink-500">{footer}</div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------- empty & loading states */

export function EmptyState({
  title = "Nothing to show yet",
  message,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  message: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-panel border border-dashed border-ink-300 bg-paper-sunken/50 px-6 py-10 text-center">
      <Icon aria-hidden className="h-6 w-6 text-ink-400" />
      <p className="mt-3 font-display text-lead font-semibold text-ink-800">{title}</p>
      <p className="mt-1.5 max-w-[48ch] text-body text-ink-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={"skeleton " + className} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="rounded-panel border border-ink-200">
      <span className="sr-only">Loading records</span>
      <div className="flex gap-4 border-b border-ink-200 bg-paper-sunken px-3 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-ink-100 px-3 py-3.5 last:border-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  const bars = [50, 80, 35, 95, 60, 75];
  return (
    <div role="status" aria-live="polite" style={{ height }} className="flex items-end gap-3 px-2 pb-6">
      <span className="sr-only">Loading chart</span>
      {bars.map((h, i) => (
        <div key={i} className="flex-1" style={{ height: h + "%" }}>
          <Skeleton className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <span className="sr-only">Loading summary</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel px-4 py-4">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="mt-4 h-7 w-1/2" />
          <Skeleton className="mt-3 h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
