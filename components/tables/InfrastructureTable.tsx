"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import DataTable, { type Column, type FilterDef } from "@/components/DataTable";
import { BoolBadge, PendingBadge, ProgressBar, StatusBadge } from "@/components/ui";
import { utilisationFlag, type Infrastructure } from "@/data";

export default function InfrastructureTable({
  rows,
  deptNames,
  showDept = false,
  pendingIds,
  editHrefBase,
}: {
  rows: Infrastructure[];
  deptNames?: Record<string, string>;
  showDept?: boolean;
  /** Infrastructure ids with a pending edit awaiting approval. */
  pendingIds?: Set<string>;
  /** When set, adds an Edit column linking to `${editHrefBase}/${id}/edit`. */
  editHrefBase?: string;
}) {
  const columns: Column<Infrastructure>[] = [
    {
      key: "name",
      header: "Lab / Classroom Name",
      value: (r) => r.labClassroomName,
      render: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{r.labClassroomName}</span>
          {pendingIds?.has(r.id) ? <PendingBadge /> : null}
        </span>
      ),
      className: "min-w-[16rem] font-medium text-ink-900",
      wrap: true,
    },
  ];

  if (showDept) {
    columns.push({
      key: "dept",
      header: "Department",
      value: (r) => deptNames?.[r.deptId] ?? r.deptId,
    });
  }

  columns.push(
    { key: "sNo", header: "S.No", value: (r) => r.sNo, align: "right" },
    { key: "floor", header: "Floor & Room No.", value: (r) => r.floorRoomNo },
    { key: "hours", header: "Hours Allotted / Week", value: (r) => r.hoursAllottedPerWeek, align: "right" },
    {
      key: "current",
      header: "Current Weekly Working Hours / Room",
      value: (r) => r.currentWeeklyWorkingHours,
      align: "right",
    },
    { key: "incharge", header: "Lab / Room In-charge", value: (r) => r.labRoomInCharge, className: "min-w-[12rem]" },
    {
      key: "support",
      header: "Lab Assistant / Support Staff",
      value: (r) => r.labAssistantSupportStaff,
      className: "min-w-[12rem]",
    },
    { key: "capacity", header: "Student Capacity", value: (r) => r.studentCapacity, align: "right" },
    {
      key: "equipment",
      header: "Major Equipment / Computers Available",
      value: (r) => r.majorEquipmentAvailable,
      className: "min-w-[22rem] text-ink-600",
      wrap: true,
    },
    {
      key: "using",
      header: "Programme(s) / Courses Using Facility",
      value: (r) => r.programmesUsingFacility,
      className: "min-w-[20rem] text-ink-600",
      wrap: true,
    },
    {
      key: "util",
      header: "Utilisation (%)",
      value: (r) => r.utilisationPct,
      render: (r) => <ProgressBar value={r.utilisationPct} />,
      className: "min-w-[9rem]",
    },
    {
      key: "flag",
      header: "Utilisation Flag",
      value: (r) => utilisationFlag(r.utilisationPct),
      render: (r) => <StatusBadge status={utilisationFlag(r.utilisationPct)} />,
      align: "center",
    },
    {
      key: "board",
      header: "Digital Smart Board",
      value: (r) => r.digitalSmartBoard,
      render: (r) => <BoolBadge value={r.digitalSmartBoard} />,
      align: "center",
    },
    {
      key: "projector",
      header: "Projector",
      value: (r) => r.projector,
      render: (r) => <BoolBadge value={r.projector} />,
      align: "center",
    }
  );

  if (editHrefBase) {
    columns.push({
      key: "edit",
      header: "Edit",
      value: () => "",
      sortable: false,
      align: "center",
      render: (r) => (
        <Link href={`${editHrefBase}/${r.id}/edit`} className="btn-quiet">
          <Pencil aria-hidden className="h-3.5 w-3.5" />
          Edit
        </Link>
      ),
    });
  }

  const filters: FilterDef<Infrastructure>[] = [];
  if (showDept && deptNames) {
    filters.push({
      key: "dept",
      label: "Department",
      options: Object.entries(deptNames).map(([value, label]) => ({ value, label })),
      match: (r, v) => r.deptId === v,
    });
  }
  filters.push({
    key: "flag",
    label: "Utilisation",
    options: [
      { value: "Under-utilised", label: "Under-utilised (< 60%)" },
      { value: "Optimal", label: "Optimal (60–95%)" },
      { value: "Over-utilised", label: "Over-utilised (> 95%)" },
    ],
    match: (r, v) => utilisationFlag(r.utilisationPct) === v,
  });
  filters.push({
    key: "board",
    label: "Digital Smart Board",
    options: [
      { value: "yes", label: "Available" },
      { value: "no", label: "Not available" },
    ],
    match: (r, v) => (v === "yes" ? r.digitalSmartBoard : !r.digitalSmartBoard),
  });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      filters={filters}
      searchable
      searchPlaceholder="Room, in-charge, equipment…"
      initialSortKey="name"
      caption="Laboratories and classrooms with weekly allocation and utilisation"
      emptyMessage="No rooms have been reported yet. They appear here once the department files its infrastructure sheet."
      stickyFirstColumn
    />
  );
}
