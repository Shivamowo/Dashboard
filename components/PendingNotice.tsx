import { Clock, TriangleAlert } from "lucide-react";
import type { ChangeRequest } from "@/data";

function formatValue(v: unknown) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (v == null || v === "") return "—";
  return String(v);
}

/** Shown on the submitter's own screen while their request awaits Admin review. */
export function PendingRequestNotice({ cr, title }: { cr: ChangeRequest; title: string }) {
  return (
    <div className="rounded-panel border border-brand-gold-200 bg-brand-gold-50 px-4 py-4">
      <div className="flex items-center gap-2">
        <Clock aria-hidden className="h-4 w-4 text-ink-700" />
        <p className="text-meta font-semibold text-ink-800">{title} — pending approval</p>
      </div>
      <p className="mt-1 text-micro leading-relaxed text-ink-600">
        Submitted {new Date(cr.submittedAt).toLocaleString()}. The values below are what you proposed —
        everyone else still sees the current record until Admin reviews this request.
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(cr.payload).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="field-label">{k}</dt>
            <dd className="field-value break-words">{formatValue(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Shown on the submitter's own screen after Admin rejects their request. */
export function RejectedRequestNotice({ cr, title }: { cr: ChangeRequest; title: string }) {
  return (
    <div className="flex items-start gap-2 rounded-panel border border-alert-100 bg-alert-50 px-4 py-4">
      <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-alert-700" />
      <div>
        <p className="text-meta font-semibold text-alert-700">{title} was rejected</p>
        <p className="mt-1 text-meta text-ink-700">{cr.reviewNotes}</p>
        <p className="mt-1 text-micro text-ink-500">Edit and resubmit below whenever you're ready.</p>
      </div>
    </div>
  );
}
