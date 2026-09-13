"use client";

import DataTable, { type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui";

/** Figures are nullable: an unreported snapshot value shows a gap, not a 0. */
export interface ComplianceRow {
  deptId: string;
  deptName: string;
  hodName: string | null;
  mobileContact: string | null;
  dateOfSubmission: string | null;
  status: string;
  certificationSignedBy: string | null;
  certificationDate: string | null;
  noOfProgrammes: number | null;
  totalFacultyReported: number | null;
  facultyWithPhd: number | null;
  totalSanctionedIntake2026: number | null;
  totalStudentsAdmitted2026: number | null;
  labsClassroomsReported: number | null;
  programmesWithNepAlignment: number | null;
  digitalSmartBoardAvailable: number | null;
  projectorAvailable: number | null;
}

export default function ComplianceTable({
  rows,
  hrefBase,
}: {
  rows: ComplianceRow[];
  hrefBase?: string;
}) {
  const columns: Column<ComplianceRow>[] = [
    {
      key: "dept",
      header: "Department",
      value: (r) => r.deptName,
      render: (r) => <span className="font-medium text-ink-900">{r.deptName}</span>,
      className: "min-w-[16rem]",
    },
    { key: "hod", header: "Name of HoD", value: (r) => r.hodName, className: "min-w-[12rem]" },
    { key: "contact", header: "Mobile / Contact No.", value: (r) => r.mobileContact },
    {
      key: "status",
      header: "Submission Status",
      value: (r) => r.status,
      render: (r) => <StatusBadge status={r.status} />,
      align: "center",
    },
    { key: "date", header: "Date of Submission", value: (r) => r.dateOfSubmission },
    { key: "signed", header: "Certification Signed By", value: (r) => r.certificationSignedBy, className: "min-w-[12rem]" },
    { key: "certDate", header: "Certification Date", value: (r) => r.certificationDate },
    { key: "progs", header: "No. of Programmes", value: (r) => r.noOfProgrammes, align: "right" },
    { key: "fac", header: "Total Faculty Reported", value: (r) => r.totalFacultyReported, align: "right" },
    { key: "phd", header: "Faculty with PhD", value: (r) => r.facultyWithPhd, align: "right" },
    { key: "intake", header: "Total Sanctioned Intake (2026)", value: (r) => r.totalSanctionedIntake2026, align: "right" },
    { key: "adm", header: "Total Students Admitted (2026)", value: (r) => r.totalStudentsAdmitted2026, align: "right" },
    { key: "labs", header: "Labs / Classrooms Reported", value: (r) => r.labsClassroomsReported, align: "right" },
    { key: "nep", header: "Programmes with NEP Alignment", value: (r) => r.programmesWithNepAlignment, align: "right" },
    { key: "board", header: "Digital Smart Board Available", value: (r) => r.digitalSmartBoardAvailable, align: "right" },
    { key: "proj", header: "Projector Available", value: (r) => r.projectorAvailable, align: "right" },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.deptId}
      rowHref={hrefBase ? (r) => `${hrefBase}/${r.deptId}` : undefined}
      initialSortKey="dept"
      caption="Submission and certification status reported by each department"
      rowActionLabel={(r) => `Open ${r.deptName} in full`}
      stickyFirstColumn
    />
  );
}
