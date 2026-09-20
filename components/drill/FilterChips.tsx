import Link from "next/link";
import { X } from "lucide-react";

export interface Chip {
  label: string;
  /** Same page with this filter removed. */
  clearHref: string;
}

/** Active drill-down filters, each removable — the link drops just that param. */
export default function FilterChips({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
      <span className="text-micro font-medium text-ink-500">Filtered by</span>
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.clearHref}
          aria-label={`Remove filter: ${c.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-pink bg-brand-pink-50 px-3 py-1 text-meta font-medium text-brand-pink-dark transition-colors hover:bg-brand-pink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
        >
          {c.label}
          <X aria-hidden className="h-3.5 w-3.5" />
        </Link>
      ))}
    </div>
  );
}
