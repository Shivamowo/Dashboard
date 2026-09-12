# PRD — VBSPU Department Data Dashboard (Frontend, Dummy Data, Full Field Coverage)

## 1. Goal
Next.js frontend, role-based, dummy data only. Every field from the 5 source sheets (Program details, Faculty Details, Infrastructure Utilization, HoD Submission, Faculty Targets) must be visible somewhere in the UI — nothing summarized away or dropped.

## 2. Roles & scope
| Role | Sees |
|---|---|
| VC | All departments — rollup + drill into any dept → HoD → faculty, full field detail at the bottom of each drill |
| Registrar | All departments — same drill chain as VC, no university comparison charts |
| HoD | Own department only — full field detail, all sheets |
| Faculty | Own record only — every Faculty Details + Faculty Targets field |
| ET | Infrastructure only, all departments — every Infrastructure Utilization field |

Role picked via header switcher, no login.

## 3. Data model — every column, mapped 1:1 to the source sheets

```ts
Department {
  id, facultyOfEngineering, name, deanName, hodName, hodContact,
  reportingPeriod, dateOfSubmission
}

Program { // from "Program details" sheet, one row per programme per dept
  id, deptId, sNo, name, yearOfCommencement, modeOfProgramme,
  sanctionedFacultyPositions: { professor, associateProfessor, assistantProfessor },
  semesterFeeByYear: { y2024, y2025, y2026 },
  sanctionedIntakeByYear: { y2024, y2025, y2026 },
  admittedByYear: { y2024, y2025, y2026 },
  nepAligned, multipleEntryExit, internshipEndOfYear,
  minorSpecialisationAvailable, remarks
}

Faculty { // from "Faculty Details" sheet, core row
  id, deptId, sNo, name, designation, appointmentType, dateOfJoining,
  hasPhd, programmesAppointedFor, teachingLoadHrsPerWeek, additionalResponsibility
}

FacultyResearch { // rest of "Faculty Details" row
  facultyId,
  journalPublications: { sciScieSsci, scopusUgcCare, other },
  conferencePublications: { international, national },
  hIndex, i10Index, googleScholarOrcidLink,
  patents: { filed, published, granted },
  phdSupervision: { registered, awarded }
}

FacultyProject { // "Sponsored / Research Projects" cols, 0..n per faculty
  id, facultyId, sponsoringAgency, yearOfGrant, duration,
  sanctionedAmount, amountReleased, currentStatus
}

Infrastructure { // "Infrastructure Utilization" sheet, one row per lab/classroom
  id, deptId, sNo, labClassroomName, floorRoomNo, hoursAllottedPerWeek,
  labRoomInCharge, labAssistantSupportStaff, studentCapacity,
  majorEquipmentAvailable, programmesUsingFacility, utilisationPct,
  digitalSmartBoard, projector
}

HodSubmission { // "HoD Submission" sheet
  deptId, mobileContact, dateOfSubmission,
  snapshot: {
    noOfProgrammes, totalFacultyReported, totalSanctionedIntake2026,
    facultyWithPhd, totalStudentsAdmitted2026, labsClassroomsReported,
    programmesWithNepAlignment, digitalSmartBoardAvailable, projectorAvailable
  },
  certificationSignedBy, certificationDate
}

DeptFacultyTargetSummary { // "Faculty Targets" sheet header block
  deptId, reviewPeriod, totalFacultyPlanned, journalPublicationTarget,
  conferencePaperTarget, sponsoredIndustryProposalsTarget,
  targetFundingLakh, patentFilingTarget, avgMilestoneAchievement
}

FacultyTarget { // "Faculty Targets" sheet, one row per faculty — every column
  id, facultyId, sNo, designation, natureOfAppointment, dateOfJoining,
  sciSciESsciJournalPapers, scopusUgcCareJournalPapers, q1q2JournalPapersSubset,
  internationalConferencePapers, nationalConferencePapers,
  govtSponsoredProjectProposals, industryProjectProposals,
  targetFundingLakh, fundingAgenciesTargeted, tentativeProjectThemeTitle,
  targetSubmissionMonth, consultancyIndustryAssignmentProposals,
  patentsToBeFiled, patentsExpectedPublished, patentsExpectedGranted,
  prototypeProductTechnologyProposed, newRevisedCourseSyllabusOrLab,
  eContentMoocInnovativeTeaching, studentMentoringHackathonInternshipPlacement,
  contributionToDeptDevelopment, contributionToUniversityDevelopment,
  expectedMeasurableOutcomeByJune2027,
  q1Plan, q2Plan, q3Plan, q4Plan,
  q1Status, q2Status, q3Status, q4Status,
  milestoneAchievementPct, hodPriority, hodRemarksSupportRequired,
  yearEndAchievementSummary
}
```

Seed 4 departments. Per dept: 4-6 Programs, 8-14 Faculty (each with FacultyResearch, 0-2 FacultyProject, 1 FacultyTarget), 8-12 Infrastructure rows, 1 HodSubmission, 1 DeptFacultyTargetSummary. Vary values realistically — don't repeat the same numbers across faculty/depts.

## 4. Pages / routes (App Router)
```
/                          → role switcher, redirect to role home
/vc                        → VC dashboard
/vc/dept/[deptId]          → full dept detail (every Program + Infra + HodSubmission field)
/vc/faculty/[facultyId]    → full faculty profile (every Faculty + Research + Project + Target field)
/registrar, /registrar/dept/[deptId], /registrar/faculty/[facultyId]  → same detail depth as VC
/hod                       → own dept dashboard
/hod/faculty/[facultyId]   → full faculty profile
/faculty                   → own full profile (mock "current" faculty)
/et                        → infra dashboard, all depts, full field table
```
Breadcrumb on every drill-down page.

## 5. Screens — field-complete

**VC / Registrar dashboard** — KPI cards (dept count, total faculty, PhD %, intake vs admitted, total publications, avg infra utilisation) → dept comparison table → click a dept → **dept detail page**:
- Programs table: every Program field as a column (scrollable table, all 3 years shown per metric).
- Infrastructure table: every Infrastructure field as a column.
- HoD Submission card: full snapshot block + mobile/contact + submission/certification date.
- Faculty roster (name, designation, PhD, teaching load) → click a row → **faculty full profile**.

**Faculty full profile** (used by VC/Registrar/HoD/Faculty self-view) — every field from Faculty, FacultyResearch, FacultyProject (list, 0..n cards), and FacultyTarget rendered as sections:
- Identity & teaching (Faculty fields)
- Research output (FacultyResearch fields)
- Sponsored projects (FacultyProject list)
- Annual targets — all target fields, quarterly plan/status/remarks as a 4-column mini-table, milestone % as progress bar

**HoD dashboard** — dept snapshot KPIs → Programs table (full fields) → Faculty roster w/ research summary → Targets tracker (all faculty, milestone %, HoD priority, at-risk flag) → Infrastructure table (full fields) → link to own HodSubmission card.

**Faculty dashboard** — own full profile page (same as above), can view but this PRD treats it read-only.

**ET dashboard** — Infrastructure table across all depts, every field as a column, filter by dept, utilisation flag color-coded.

## 6. Components
`RoleSwitcher`, `KpiCard`, `DataTable` (sortable/filterable, handles wide tables with many columns — horizontal scroll, not column-dropping), `TrendChart` (recharts), `ProgressBar`, `StatusBadge`, `Breadcrumb`, `FacultyProfileSections`, `DeptDetailSections`.

## 7. Non-goals
No auth, no real DB, no API, no persistence, no write actions.

## 8. Acceptance criteria
- Every field listed in section 3 appears on at least one screen, unabbreviated.
- Wide tables scroll horizontally rather than hiding columns.
- Aggregates computed at render time from mock arrays, never hardcoded.
- Drill chain (dept → faculty) works from both VC and Registrar.
- Responsive to tablet width. Built with Next.js (App Router) + TypeScript + Tailwind.
