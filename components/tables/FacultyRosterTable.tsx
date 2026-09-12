"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import DataTable, { type Column, type FilterDef } from "@/components/DataTable";
import { Badge, BoolBadge, PendingBadge, ProgressBar } from "@/components/ui";
import type { FacultyRosterRow } from "@/lib/rows";

export default function FacultyRosterTable({
  rows,
  hrefBase,
  deptNames,
  showDept = false,
  showMilestone = true,
  pendingIds,
  editHrefBase,
}: {
  rows: FacultyRosterRow[];
  hrefBase: string;
  deptNames?: Record<string, string>;
  showDept?: boolean;
  showMilestone?: boolean;
  /** Faculty ids with a pending edit awaiting approval — shows a "Pending approval" badge. */
  pendingIds?: Set<string>;
  /** When set, adds an Edit column linking to `${editHrefBase}/${id}/edit`. */
  editHrefBase?: string;
}) {
  const columns: Column<FacultyRosterRow>[] = [
    {
      key: "name",
      header: "Name of Faculty Member",
      value: (r) => r.name,
      render: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-brand-pink-dark">{r.name}</span>
          {pendingIds?.has(r.id) ? <PendingBadge /> : null}
        </span>
      ),
      className: "min-w-[14rem]",
    },
  ];

  if (showDept) {
    columns.push({
      key: "dept",
      header: "Department",
      value: (r) => r.deptName,
      className: "min-w-[14rem]",
    });
  }

  columns.push(
    { key: "designation", header: "Designation", value: (r) => r.designation },
    { key: "appointment", header: "Appointment Type", value: (r) => r.appointmentType },
    { key: "doj", header: "Date of Joining", value: (r) => r.dateOfJoining },
    {
      key: "phd",
      header: "PhD",
      value: (r) => r.hasPhd,
      render: (r) => <BoolBadge value={r.hasPhd} />,
      align: "center",
    },
    {
      key: "programmes",
      header: "Programme(s) for which Appointed",
      value: (r) => r.programmesAppointedFor,
      className: "min-w-[20rem] text-ink-600",
      wrap: true,
    },
    {
      key: "load",
      header: "Teaching Load (Hrs/Week)",
      value: (r) => r.teachingLoadHrsPerWeek,
      align: "right",
    },
    {
      key: "responsibility",
      header: "Additional Responsibility",
      value: (r) => r.additionalResponsibility,
      className: "min-w-[16rem] text-ink-600",
      wrap: true,
    },
    { key: "journal", header: "Journal Pubs (total)", value: (r) => r.journalTotal, align: "right" },
    { key: "sci", header: "SCI/SCIE/SSCI", value: (r) => r.sci, align: "right" },
    { key: "scopus", header: "Scopus / UGC CARE", value: (r) => r.scopus, align: "right" },
    { key: "conference", header: "Conference Pubs (total)", value: (r) => r.conferenceTotal, align: "right" },
    { key: "h", header: "H-Index", value: (r) => r.hIndex, align: "right" },
    { key: "i10", header: "i10-Index", value: (r) => r.i10Index, align: "right" },
    { key: "patents", header: "Patents Filed", value: (r) => r.patentsFiled, align: "right" },
    { key: "phdReg", header: "PhD Registered", value: (r) => r.phdRegistered, align: "right" },
    { key: "phdAwd", header: "PhD Awarded", value: (r) => r.phdAwarded, align: "right" }
  );

  if (showMilestone) {
    columns.push(
      {
        key: "milestone",
        header: "Milestone Achievement",
        value: (r) => r.milestonePct,
        render: (r) => <ProgressBar value={r.milestonePct} />,
        className: "min-w-[10rem]",
      },
      {
        key: "priority",
        header: "HoD Priority",
        value: (r) => r.hodPriority,
        render: (r) => <Badge tone="neutral">{r.hodPriority}</Badge>,
        align: "center",
      }
    );
  }

  if (editHrefBase) {
    columns.push({
      key: "edit",
      header: "Edit",
      value: () => "",
      sortable: false,
      align: "center",
      render: (r) => (
        <Link
          href={`${editHrefBase}/${r.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="btn-quiet"
        >
          <Pencil aria-hidden className="h-3.5 w-3.5" />
          Edit
        </Link>
      ),
    });
  }

  const filters: FilterDef<FacultyRosterRow>[] = [];
  if (showDept && deptNames) {
    filters.push({
      key: "dept",
      label: "Department",
      options: Object.entries(deptNames).map(([value, label]) => ({ value, label })),
      match: (r, v) => r.deptId === v,
    });
  }
  filters.push(
    {
      key: "designation",
      label: "Designation",
      options: [
        { value: "Professor", label: "Professor" },
        { value: "Associate Professor", label: "Associate Professor" },
        { value: "Assistant Professor", label: "Assistant Professor" },
        { value: "Guest Faculty", label: "Guest Faculty" },
      ],
      match: (r, v) => r.designation === v,
    },
    {
      key: "phd",
      label: "PhD",
      options: [
        { value: "yes", label: "With PhD" },
        { value: "no", label: "Without PhD" },
      ],
      match: (r, v) => (v === "yes" ? r.hasPhd : !r.hasPhd),
    },
    {
      key: "appointment",
      label: "Appointment Type",
      options: [
        { value: "Regular", label: "Regular" },
        { value: "Contractual", label: "Contractual" },
        { value: "Self-Financing", label: "Self-Financing" },
        { value: "Guest", label: "Guest" },
      ],
      match: (r, v) => r.appointmentType === v,
    }
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      rowHref={(r) => `${hrefBase}/${r.id}`}
      filters={filters}
      searchable
      searchPlaceholder="Faculty name, responsibility…"
      initialSortKey="name"
      caption="Faculty appointments with teaching load and research summary"
      rowActionLabel={(r) => `Open the full record for ${r.name}`}
      emptyMessage="No faculty have been reported yet. Appointments appear here once the department files them."
      stickyFirstColumn
    />
  );
}
