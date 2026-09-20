"use client";

import DataTable, { type Column, type FilterDef } from "@/components/DataTable";
import { BoolBadge } from "@/components/ui";
import { addNullable, type Program } from "@/data";
import { admittedOfIntake, delta, inr, ratioBar, slashed, text } from "@/components/cells";
import { programLevel } from "@/lib/labels";

export type ProgramStatsRow = Program & { deptName: string };

/** Sorting keeps nulls as null so DataTable pushes unreported rows to the end. */
const fillPct = (a: number | null, b: number | null) =>
  a == null || b == null || !b ? null : Math.round((a / b) * 100);

export default function ProgramStatsTable({
  rows,
  deptNames,
}: {
  rows: ProgramStatsRow[];
  deptNames: Record<string, string>;
}) {
  const columns: Column<ProgramStatsRow>[] = [
    {
      key: "name",
      header: "Name of the Programme",
      value: (r) => r.name,
      className: "min-w-[18rem] font-medium text-ink-900",
      wrap: true,
      primary: true,
    },
    {
      key: "level",
      header: "Level",
      value: (r) => programLevel(r.name),
      render: (r) => text(programLevel(r.name)),
      primary: true,
    },
    {
      key: "admInt26",
      header: "Admitted / Intake 2026",
      value: (r) => r.admittedByYear.y2026,
      render: (r) => admittedOfIntake(r.admittedByYear.y2026, r.sanctionedIntakeByYear.y2026),
      align: "right",
      primary: true,
    },
    { key: "dept", header: "Department", value: (r) => r.deptName, className: "min-w-[14rem]" },
    { key: "year", header: "Year of Commencement", value: (r) => r.yearOfCommencement, align: "right" },
    { key: "mode", header: "Mode of Programme", value: (r) => r.modeOfProgramme, render: (r) => text(r.modeOfProgramme) },
    { key: "int24", header: "Intake 2024", value: (r) => r.sanctionedIntakeByYear.y2024, align: "right" },
    { key: "adm24", header: "Admitted 2024", value: (r) => r.admittedByYear.y2024, align: "right" },
    {
      key: "fill24",
      header: "Fill 2024",
      value: (r) => fillPct(r.admittedByYear.y2024, r.sanctionedIntakeByYear.y2024),
      render: (r) => ratioBar(r.admittedByYear.y2024, r.sanctionedIntakeByYear.y2024),
      className: "min-w-[9rem]",
    },
    { key: "int25", header: "Intake 2025", value: (r) => r.sanctionedIntakeByYear.y2025, align: "right" },
    { key: "adm25", header: "Admitted 2025", value: (r) => r.admittedByYear.y2025, align: "right" },
    {
      key: "fill25",
      header: "Fill 2025",
      value: (r) => fillPct(r.admittedByYear.y2025, r.sanctionedIntakeByYear.y2025),
      render: (r) => ratioBar(r.admittedByYear.y2025, r.sanctionedIntakeByYear.y2025),
      className: "min-w-[9rem]",
    },
    { key: "int26", header: "Intake 2026", value: (r) => r.sanctionedIntakeByYear.y2026, align: "right" },
    { key: "adm26", header: "Admitted 2026", value: (r) => r.admittedByYear.y2026, align: "right" },
    {
      key: "fill26",
      header: "Fill 2026",
      value: (r) => fillPct(r.admittedByYear.y2026, r.sanctionedIntakeByYear.y2026),
      render: (r) => ratioBar(r.admittedByYear.y2026, r.sanctionedIntakeByYear.y2026),
      className: "min-w-[9rem]",
    },
    {
      key: "trend",
      header: "Admission Trend 2024→2026",
      value: (r) =>
        r.admittedByYear.y2026 == null || r.admittedByYear.y2024 == null
          ? null
          : r.admittedByYear.y2026 - r.admittedByYear.y2024,
      render: (r) => delta(r.admittedByYear.y2024, r.admittedByYear.y2026),
      align: "right",
    },
    { key: "fee26", header: "Semester Fee 2026", value: (r) => r.semesterFeeByYear.y2026, render: (r) => inr(r.semesterFeeByYear.y2026), align: "right" },
    {
      key: "sanctionedFac",
      header: "Sanctioned Faculty (P/AP/AsP)",
      value: (r) =>
        addNullable(
          r.sanctionedFacultyPositions.professor,
          r.sanctionedFacultyPositions.associateProfessor,
          r.sanctionedFacultyPositions.assistantProfessor
        ),
      render: (r) =>
        slashed(
          r.sanctionedFacultyPositions.professor,
          r.sanctionedFacultyPositions.associateProfessor,
          r.sanctionedFacultyPositions.assistantProfessor
        ),
      align: "center",
    },
    { key: "nep", header: "NEP Aligned", value: (r) => r.nepAligned, render: (r) => <BoolBadge value={r.nepAligned} />, align: "center" },
    { key: "mee", header: "Multiple Entry/Exit", value: (r) => r.multipleEntryExit, render: (r) => <BoolBadge value={r.multipleEntryExit} />, align: "center" },
    { key: "intern", header: "Internship at End of Every Year", value: (r) => r.internshipEndOfYear, render: (r) => <BoolBadge value={r.internshipEndOfYear} />, align: "center" },
    { key: "minor", header: "Minor / Specialisation Available", value: (r) => r.minorSpecialisationAvailable, render: (r) => <BoolBadge value={r.minorSpecialisationAvailable} />, align: "center" },
    { key: "remarks", header: "Remarks", value: (r) => r.remarks, render: (r) => text(r.remarks), className: "min-w-[20rem] text-ink-600", wrap: true },
  ];

  const filters: FilterDef<ProgramStatsRow>[] = [
    {
      key: "dept",
      label: "Department",
      options: Object.entries(deptNames).map(([value, label]) => ({ value, label })),
      match: (r, v) => r.deptId === v,
    },
    {
      key: "mode",
      label: "Mode of Programme",
      options: [
        { value: "Regular", label: "Regular" },
        { value: "Regular (Aided)", label: "Regular (Aided)" },
        { value: "Self-Financing", label: "Self-Financing" },
      ],
      match: (r, v) => r.modeOfProgramme === v,
    },
    {
      key: "nep",
      label: "NEP Alignment",
      options: [
        { value: "yes", label: "NEP aligned" },
        { value: "no", label: "Not aligned" },
        { value: "unknown", label: "Not provided" },
      ],
      // "Not aligned" means the department answered No — a programme that never
      // answered belongs under its own option, not lumped in with the No's.
      match: (r, v) =>
        v === "yes" ? r.nepAligned === true : v === "no" ? r.nepAligned === false : r.nepAligned == null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      filters={filters}
      searchable
      searchPlaceholder="Programme name, remarks…"
      initialSortKey="dept"
      caption="Sanctioned intake against students admitted for every programme"
      stickyFirstColumn
    />
  );
}
