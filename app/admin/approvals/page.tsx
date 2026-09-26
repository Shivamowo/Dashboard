import {
  departmentById,
  facultyById,
  findUserById,
  hodSubmissionOf,
  infrastructureById,
  pendingChangeRequests,
  projectsOf,
  researchOf,
  reviewedChangeRequests,
  targetOf,
  type ChangeRequest,
} from "@/data";
import { adminApprove, adminReject } from "@/lib/actions";
import { Badge, EmptyState, PageHeading, Section, StatusBadge } from "@/components/ui";

function formatVal(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? JSON.stringify(v) : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function currentRecordFor(cr: ChangeRequest): Record<string, unknown> | undefined {
  if (cr.type === "onboarding") return undefined;
  if (cr.targetEntity === "Faculty" && cr.targetId) {
    const section = cr.section ?? "profile";
    if (section === "research") return researchOf(cr.targetId) as unknown as Record<string, unknown>;
    if (section === "target") return targetOf(cr.targetId) as unknown as Record<string, unknown>;
    if (section === "projects") return { projects: projectsOf(cr.targetId) };
    return facultyById(cr.targetId) as unknown as Record<string, unknown>;
  }
  if (cr.targetEntity === "HoD") {
    const s = hodSubmissionOf(cr.deptId);
    return s
      ? { mobileContact: s.mobileContact, certificationSignedBy: s.certificationSignedBy, certificationDate: s.certificationDate }
      : undefined;
  }
  if (cr.targetEntity === "Infrastructure" && cr.targetId) {
    return infrastructureById(cr.targetId) as unknown as Record<string, unknown>;
  }
  return undefined;
}

function targetLabel(cr: ChangeRequest): string {
  if (cr.targetEntity === "Faculty") {
    if (cr.type === "onboarding") return String((cr.payload as { name?: string }).name ?? "New faculty member");
    return facultyById(cr.targetId ?? "")?.name ?? cr.targetId ?? "Unknown faculty";
  }
  if (cr.targetEntity === "HoD") {
    const dept = departmentById(cr.deptId);
    return cr.type === "onboarding"
      ? `HoD of ${dept?.name ?? cr.deptId}`
      : `${dept?.hodName ?? "HoD"} · ${dept?.name ?? cr.deptId}`;
  }
  return infrastructureById(cr.targetId ?? "")?.labClassroomName ?? cr.targetId ?? "Unknown room";
}

function RequestCard({ cr }: { cr: ChangeRequest }) {
  const dept = departmentById(cr.deptId);
  const submitter = findUserById(cr.submittedByUserId);
  const current = currentRecordFor(cr);
  const keys = Object.keys(cr.payload);

  return (
    <div className="rounded-panel border border-ink-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-paper-sunken px-4 py-3">
        <div>
          <p className="font-display text-lead font-semibold text-ink-900">{targetLabel(cr)}</p>
          <p className="mt-0.5 text-micro text-ink-500">
            {cr.type === "onboarding" ? "Onboarding" : "Edit"} · {cr.targetEntity}
            {cr.section ? ` · ${cr.section}` : ""} · {dept?.name ?? cr.deptId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{cr.submittedByRole.toUpperCase()}</Badge>
          <span className="text-micro text-ink-500">
            {submitter?.displayName ?? cr.submittedByUserId} · {new Date(cr.submittedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="table-scroll rounded-panel border border-ink-200">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr>
                <th scope="col" className="th">Field</th>
                <th scope="col" className="th">Current</th>
                <th scope="col" className="th">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k} className="bg-paper-raised">
                  <th scope="row" className="td text-left font-medium text-ink-700">{k}</th>
                  <td className="td text-ink-500">{current ? formatVal((current as Record<string, unknown>)[k]) : "— (new record)"}</td>
                  <td className="td font-medium text-ink-900">{formatVal((cr.payload as Record<string, unknown>)[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cr.status === "pending" ? (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink-200 pt-4">
            <form action={adminApprove.bind(null, cr.id)}>
              <button type="submit" className="btn-primary">Approve</button>
            </form>
            <form action={adminReject.bind(null, cr.id)} className="flex flex-1 items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`reason-${cr.id}`} className="field-label">Rejection reason (required to reject)</label>
                <input id={`reason-${cr.id}`} name="reviewNotes" type="text" className="input mt-1.5" placeholder="Explain what needs to change" />
              </div>
              <button type="submit" className="rounded-control border border-alert-100 bg-alert-50 px-4 py-2.5 text-body font-semibold text-alert-700 transition-colors hover:bg-alert-100">
                Reject
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 border-t border-ink-200 pt-4">
            <StatusBadge status={cr.status === "approved" ? "Submitted" : "Delayed"} />
            <span className="text-micro text-ink-500">
              {cr.status === "approved" ? "Approved" : "Rejected"} {cr.reviewedAt ? new Date(cr.reviewedAt).toLocaleString() : ""}
              {cr.reviewNotes ? ` — ${cr.reviewNotes}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminApprovalsPage() {
  const pending = pendingChangeRequests();
  const reviewed = reviewedChangeRequests().slice(0, 20);

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Administrator", href: "/admin" }, { label: "Approvals" }]}
        title="Approval queue"
        subtitle="Every edit and onboarding request submitted by Faculty, HoD or ET, awaiting your review."
      />

      <div id="approvals" className="scroll-mt-6 space-y-6">
        <Section title={`Pending (${pending.length})`}>
          {pending.length === 0 ? (
            <EmptyState title="Nothing waiting" message="Every submitted request has been reviewed." />
          ) : (
            <div className="space-y-4">
              {pending.map((cr) => (
                <RequestCard key={cr.id} cr={cr} />
              ))}
            </div>
          )}
        </Section>

        {reviewed.length > 0 ? (
          <Section title="Recently reviewed" description="Your last 20 approvals and rejections.">
            <div className="space-y-4">
              {reviewed.map((cr) => (
                <RequestCard key={cr.id} cr={cr} />
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
