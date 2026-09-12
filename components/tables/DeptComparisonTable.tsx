"use client";

import DataTable, { type Column } from "@/components/DataTable";
import { Badge, ProgressBar } from "@/components/ui";

export interface DeptComparisonRow {
  id: string;
  name: string;
  hodName: string;
  facultyCount: number;
  phdCount: number;
  phdPct: number;
  programCount: number;
  sanctionedIntake2026: number;
  admitted2026: number;
  fillRatePct: number;
  journalPublications: number;
  conferencePublications: number;
  totalPublications: number;
  patentsFiled: number;
  avgTeachingLoad: number;
  infraRooms: number;
  avgUtilisation: number;
  avgMilestonePct: number;
  atRiskFaculty: number;
}

export default function DeptComparisonTable({
  rows,
  hrefBase,
}: {
  rows: DeptComparisonRow[];
  hrefBase: string;
}) {
  const columns: Column<DeptComparisonRow>[] = [
    {
      key: "name",
      header: "Department",
      value: (r) => r.name,
      render: (r) => (
        <span className="font-medium text-seal-700">{r.name}</span>
      ),
      className: "min-w-[16rem]",
    },
    { key: "hod", header: "Head of Department", value: (r) => r.hodName, className: "min-w-[12rem]" },
    { key: "programs", header: "Programmes", value: (r) => r.programCount, align: "right" },
    { key: "faculty", header: "Faculty", value: (r) => r.facultyCount, align: "right" },
    { key: "phd", header: "Faculty with PhD", value: (r) => r.phdCount, align: "right" },
    {
      key: "phdPct",
      header: "PhD %",
      value: (r) => r.phdPct,
      render: (r) => r.phdPct + "%",
      align: "right",
    },
    { key: "intake", header: "Sanctioned Intake 2026", value: (r) => r.sanctionedIntake2026, align: "right" },
    { key: "admitted", header: "Admitted 2026", value: (r) => r.admitted2026, align: "right" },
    {
      key: "fill",
      header: "Intake Fill Rate",
      value: (r) => r.fillRatePct,
      render: (r) => <ProgressBar value={r.fillRatePct} />,
      className: "min-w-[10rem]",
    },
    { key: "journal", header: "Journal Publications", value: (r) => r.journalPublications, align: "right" },
    { key: "conf", header: "Conference Publications", value: (r) => r.conferencePublications, align: "right" },
    { key: "pubs", header: "Total Publications", value: (r) => r.totalPublications, align: "right" },
    { key: "patents", header: "Patents Filed", value: (r) => r.patentsFiled, align: "right" },
    { key: "load", header: "Avg Teaching Load (hrs)", value: (r) => r.avgTeachingLoad, align: "right" },
    { key: "rooms", header: "Labs / Classrooms", value: (r) => r.infraRooms, align: "right" },
    {
      key: "util",
      header: "Avg Infra Utilisation",
      value: (r) => r.avgUtilisation,
      render: (r) => <ProgressBar value={Math.round(r.avgUtilisation)} />,
      className: "min-w-[10rem]",
    },
    {
      key: "milestone",
      header: "Avg Milestone Achievement",
      value: (r) => r.avgMilestonePct,
      render: (r) => <ProgressBar value={Math.round(r.avgMilestonePct)} />,
      className: "min-w-[10rem]",
    },
    {
      key: "risk",
      header: "Faculty At Risk",
      value: (r) => r.atRiskFaculty,
      render: (r) =>
        r.atRiskFaculty > 0 ? (
          <Badge tone={r.atRiskFaculty > 3 ? "alert" : "caution"}>{r.atRiskFaculty}</Badge>
        ) : (
          <Badge tone="positive">0</Badge>
        ),
      align: "center",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      rowHref={(r) => `${hrefBase}/${r.id}`}
      initialSortKey="name"
      caption="Departments compared on staffing, admissions, research and utilisation"
      rowActionLabel={(r) => `Open ${r.name} in full`}
      stickyFirstColumn
    />
  );
}
