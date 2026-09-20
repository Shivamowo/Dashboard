"use client";

import DataTable, { type Column, type FilterDef } from "@/components/DataTable";
import { num } from "@/components/cells";
import { addNullable } from "@/data";
import type { FacultyRosterRow } from "@/lib/rows";

export default function PublicationsTable({
  rows,
  hrefBase,
  deptNames,
}: {
  rows: FacultyRosterRow[];
  hrefBase: string;
  deptNames: Record<string, string>;
}) {
  const total = (r: FacultyRosterRow) => addNullable(r.journalTotal, r.conferenceTotal);
  const columns: Column<FacultyRosterRow>[] = [
    {
      key: "name",
      header: "Faculty Member",
      value: (r) => r.name,
      render: (r) => <span className="font-medium text-brand-pink-dark">{r.name}</span>,
      className: "min-w-[14rem]",
      primary: true,
    },
    { key: "dept", header: "Department", value: (r) => r.deptName, className: "min-w-[14rem]", primary: true },
    { key: "total", header: "Total Publications", value: total, render: (r) => num(total(r)), align: "right", primary: true },
    { key: "journal", header: "Journal Papers", value: (r) => r.journalTotal, render: (r) => num(r.journalTotal), align: "right" },
    { key: "sci", header: "SCI/SCIE/SSCI", value: (r) => r.sci, render: (r) => num(r.sci), align: "right" },
    { key: "scopus", header: "Scopus / UGC CARE", value: (r) => r.scopus, render: (r) => num(r.scopus), align: "right" },
    { key: "conference", header: "Conference Papers", value: (r) => r.conferenceTotal, render: (r) => num(r.conferenceTotal), align: "right" },
    { key: "h", header: "H-Index", value: (r) => r.hIndex, render: (r) => num(r.hIndex), align: "right" },
    { key: "patents", header: "Patents Filed", value: (r) => r.patentsFiled, render: (r) => num(r.patentsFiled), align: "right" },
  ];
  const filters: FilterDef<FacultyRosterRow>[] = [
    {
      key: "dept",
      label: "Department",
      options: Object.entries(deptNames).map(([value, label]) => ({ value, label })),
      match: (r, v) => r.deptIds.includes(v),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      rowHref={(r) => `${hrefBase}/${r.id}`}
      rowActionLabel={(r) => `Open the full record for ${r.name}`}
      filters={filters}
      searchable
      searchPlaceholder="Faculty name…"
      initialSortKey="total"
      initialSortDir="desc"
      caption="Publications reported per faculty member"
      stickyFirstColumn
    />
  );
}
