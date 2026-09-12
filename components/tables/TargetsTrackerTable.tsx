"use client";

import DataTable, { type Column, type FilterDef } from "@/components/DataTable";
import { Badge, ProgressBar, StatusBadge } from "@/components/ui";
import type { TargetTrackerRow } from "@/lib/rows";

const AT_RISK_THRESHOLD = 50;

export default function TargetsTrackerTable({
  rows,
  hrefBase,
}: {
  rows: TargetTrackerRow[];
  hrefBase: string;
}) {
  const columns: Column<TargetTrackerRow>[] = [
    {
      key: "name",
      header: "Faculty Member",
      value: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-seal-700">{r.name}</span>
          {r.milestonePct < AT_RISK_THRESHOLD ? <Badge tone="alert">At risk</Badge> : null}
        </span>
      ),
      className: "min-w-[16rem]",
    },
    { key: "designation", header: "Designation", value: (r) => r.designation },
    { key: "appointment", header: "Nature of Appointment", value: (r) => r.natureOfAppointment },
    { key: "journal", header: "Journal Target", value: (r) => r.journalTarget, align: "right" },
    { key: "conference", header: "Conference Target", value: (r) => r.conferenceTarget, align: "right" },
    { key: "proposals", header: "Project Proposal Target", value: (r) => r.proposalTarget, align: "right" },
    {
      key: "funding",
      header: "Target Funding (₹ Lakh)",
      value: (r) => r.fundingTargetLakh,
      align: "right",
    },
    { key: "patent", header: "Patent Filing Target", value: (r) => r.patentTarget, align: "right" },
    { key: "month", header: "Target Submission Month", value: (r) => r.targetSubmissionMonth },
    {
      key: "theme",
      header: "Tentative Project Theme / Title",
      value: (r) => r.theme,
      className: "min-w-[22rem] text-ink-600",
      wrap: true,
    },
    { key: "q1", header: "Q1 Status", value: (r) => r.q1Status, render: (r) => <StatusBadge status={r.q1Status} />, align: "center" },
    { key: "q2", header: "Q2 Status", value: (r) => r.q2Status, render: (r) => <StatusBadge status={r.q2Status} />, align: "center" },
    { key: "q3", header: "Q3 Status", value: (r) => r.q3Status, render: (r) => <StatusBadge status={r.q3Status} />, align: "center" },
    { key: "q4", header: "Q4 Status", value: (r) => r.q4Status, render: (r) => <StatusBadge status={r.q4Status} />, align: "center" },
    {
      key: "milestone",
      header: "Milestone Achievement %",
      value: (r) => r.milestonePct,
      render: (r) => <ProgressBar value={r.milestonePct} />,
      className: "min-w-[10rem]",
    },
    {
      key: "priority",
      header: "HoD Priority",
      value: (r) => r.hodPriority,
      render: (r) => <StatusBadge status={r.hodPriority} />,
      align: "center",
    },
    {
      key: "remarks",
      header: "HoD Remarks / Support Required",
      value: (r) => r.hodRemarks,
      className: "min-w-[20rem] text-ink-600",
      wrap: true,
    },
  ];

  const filters: FilterDef<TargetTrackerRow>[] = [
    {
      key: "risk",
      label: "Progress",
      options: [
        { value: "risk", label: "At risk (< 50%)" },
        { value: "ok", label: "On plan (≥ 50%)" },
      ],
      match: (r, v) =>
        v === "risk" ? r.milestonePct < AT_RISK_THRESHOLD : r.milestonePct >= AT_RISK_THRESHOLD,
    },
    {
      key: "priority",
      label: "HoD Priority",
      options: [
        { value: "High", label: "High" },
        { value: "Medium", label: "Medium" },
        { value: "Low", label: "Low" },
      ],
      match: (r, v) => r.hodPriority === v,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      rowHref={(r) => `${hrefBase}/${r.facultyId}`}
      filters={filters}
      searchable
      searchPlaceholder="Faculty, theme, remarks…"
      initialSortKey="milestone"
      caption="Annual targets and quarterly progress for each faculty member"
      rowActionLabel={(r) => `Open the full record for ${r.name}`}
      emptyMessage="No target sheets have been filed for this review period."
      stickyFirstColumn
    />
  );
}
