"use client";

import DataTable, { type Column } from "@/components/DataTable";
import { BoolBadge } from "@/components/ui";
import type { Program } from "@/data";
import { admittedOfIntake, inr, num, pctText, ratioBar, text } from "@/components/cells";
import { programLevel } from "@/lib/labels";

export default function ProgramsTable({ programs }: { programs: Program[] }) {
  const columns: Column<Program>[] = [
    { key: "sNo", header: "S.No", value: (p) => p.sNo, align: "right" },
    {
      key: "name",
      header: "Name of the Programme",
      value: (p) => p.name,
      className: "min-w-[18rem] font-medium text-ink-900",
      wrap: true,
      primary: true,
    },
    {
      key: "level",
      header: "Level",
      value: (p) => programLevel(p.name),
      render: (p) => text(programLevel(p.name)),
      primary: true,
    },
    {
      key: "admInt26",
      header: "Admitted / Intake 2026",
      value: (p) => p.admittedByYear.y2026,
      render: (p) => admittedOfIntake(p.admittedByYear.y2026, p.sanctionedIntakeByYear.y2026),
      align: "right",
      primary: true,
    },
    { key: "year", header: "Year of Commencement", value: (p) => p.yearOfCommencement, render: (p) => num(p.yearOfCommencement), align: "right" },
    { key: "mode", header: "Mode of Programme", value: (p) => p.modeOfProgramme, render: (p) => text(p.modeOfProgramme) },
    {
      key: "prof",
      header: "Sanctioned — Professor",
      value: (p) => p.sanctionedFacultyPositions.professor,
      align: "right",
    },
    {
      key: "assoc",
      header: "Sanctioned — Associate Professor",
      value: (p) => p.sanctionedFacultyPositions.associateProfessor,
      render: (p) => num(p.sanctionedFacultyPositions.associateProfessor),
      align: "right",
    },
    {
      key: "asst",
      header: "Sanctioned — Assistant Professor",
      value: (p) => p.sanctionedFacultyPositions.assistantProfessor,
      render: (p) => num(p.sanctionedFacultyPositions.assistantProfessor),
      align: "right",
    },
    { key: "fee24", header: "Semester Fee 2024", value: (p) => p.semesterFeeByYear.y2024, render: (p) => inr(p.semesterFeeByYear.y2024), align: "right" },
    { key: "fee25", header: "Semester Fee 2025", value: (p) => p.semesterFeeByYear.y2025, render: (p) => inr(p.semesterFeeByYear.y2025), align: "right" },
    { key: "fee26", header: "Semester Fee 2026", value: (p) => p.semesterFeeByYear.y2026, render: (p) => inr(p.semesterFeeByYear.y2026), align: "right" },
    { key: "int24", header: "Sanctioned Intake 2024", value: (p) => p.sanctionedIntakeByYear.y2024, render: (p) => num(p.sanctionedIntakeByYear.y2024), align: "right" },
    { key: "int25", header: "Sanctioned Intake 2025", value: (p) => p.sanctionedIntakeByYear.y2025, render: (p) => num(p.sanctionedIntakeByYear.y2025), align: "right" },
    { key: "int26", header: "Sanctioned Intake 2026", value: (p) => p.sanctionedIntakeByYear.y2026, render: (p) => num(p.sanctionedIntakeByYear.y2026), align: "right" },
    { key: "adm24", header: "Admitted 2024", value: (p) => p.admittedByYear.y2024, render: (p) => num(p.admittedByYear.y2024), align: "right" },
    { key: "adm25", header: "Admitted 2025", value: (p) => p.admittedByYear.y2025, render: (p) => num(p.admittedByYear.y2025), align: "right" },
    { key: "adm26", header: "Admitted 2026", value: (p) => p.admittedByYear.y2026, render: (p) => num(p.admittedByYear.y2026), align: "right" },
    {
      key: "fill",
      header: "Fill Rate 2026",
      // Needs both halves reported; otherwise the cell shows the gap rather
      // than a rate computed against a number nobody supplied.
      value: (p) =>
        p.sanctionedIntakeByYear.y2026 && p.admittedByYear.y2026 != null
          ? Math.round((p.admittedByYear.y2026 / p.sanctionedIntakeByYear.y2026) * 100)
          : null,
      render: (p) => ratioBar(p.admittedByYear.y2026, p.sanctionedIntakeByYear.y2026),
      align: "right",
    },
    { key: "nep", header: "NEP Aligned", value: (p) => p.nepAligned, render: (p) => <BoolBadge value={p.nepAligned} />, align: "center" },
    { key: "mee", header: "Multiple Entry/Exit", value: (p) => p.multipleEntryExit, render: (p) => <BoolBadge value={p.multipleEntryExit} />, align: "center" },
    { key: "intern", header: "Internship at End of Every Year", value: (p) => p.internshipEndOfYear, render: (p) => <BoolBadge value={p.internshipEndOfYear} />, align: "center" },
    { key: "minor", header: "Minor / Specialisation Available", value: (p) => p.minorSpecialisationAvailable, render: (p) => <BoolBadge value={p.minorSpecialisationAvailable} />, align: "center" },
    { key: "remarks", header: "Remarks", value: (p) => p.remarks, className: "min-w-[20rem] text-ink-600", wrap: true },
  ];

  return (
    <DataTable
      columns={columns}
      rows={programs}
      rowKey={(p) => p.id}
      initialSortKey="sNo"
      caption="Programme details as submitted by the department"
      stickyFirstColumn
    />
  );
}
