import type { Program } from "./types";
import { makeRng, hashString, int, chance } from "./rng";

type ProgramSeed = {
  name: string;
  yearOfCommencement: number;
  mode: Program["modeOfProgramme"];
  intake: number;
  fee: number;
  nep: boolean;
  mee: boolean;
  internship: boolean;
  minor: boolean;
  remarks: string;
};

const seeds: Record<string, ProgramSeed[]> = {
  cse: [
    { name: "B.Tech. (Computer Science & Engineering)", yearOfCommencement: 2000, mode: "Regular (Aided)", intake: 120, fee: 61000, nep: true, mee: true, internship: true, minor: true, remarks: "Two sections (CSE-A, CSE-B) from 2nd year onwards." },
    { name: "B.Tech. (CSE — Artificial Intelligence & Machine Learning)", yearOfCommencement: 2022, mode: "Self-Financing", intake: 60, fee: 71000, nep: true, mee: true, internship: true, minor: true, remarks: "AICTE approved new-age programme." },
    { name: "B.Tech. (CSE — Data Science)", yearOfCommencement: 2023, mode: "Self-Financing", intake: 60, fee: 71000, nep: true, mee: true, internship: true, minor: false, remarks: "First batch reaching 3rd year in 2026-27." },
    { name: "M.Tech. (Computer Science & Engineering)", yearOfCommencement: 2011, mode: "Regular (Aided)", intake: 18, fee: 40000, nep: true, mee: false, internship: false, minor: false, remarks: "Includes 6 GATE-sponsored seats." },
    { name: "Ph.D. (Computer Science & Engineering)", yearOfCommencement: 2013, mode: "Regular", intake: 12, fee: 25000, nep: false, mee: false, internship: false, minor: false, remarks: "Intake as per vacancy notified by RDC." },
  ],
  it: [
    { name: "B.Tech. (Information Technology)", yearOfCommencement: 2001, mode: "Regular (Aided)", intake: 66, fee: 61000, nep: true, mee: true, internship: true, minor: true, remarks: "60 + 6 (EWS) sanctioned seats." },
    { name: "B.Tech. (IT — Cyber Security)", yearOfCommencement: 2023, mode: "Self-Financing", intake: 60, fee: 71000, nep: true, mee: true, internship: true, minor: true, remarks: "Industry-aligned curriculum with CERT-In inputs." },
    { name: "M.Tech. (Information Technology)", yearOfCommencement: 2014, mode: "Self-Financing", intake: 18, fee: 44000, nep: true, mee: false, internship: false, minor: false, remarks: "Weekend mode for working professionals discontinued in 2024." },
    { name: "MCA (Master of Computer Applications)", yearOfCommencement: 2005, mode: "Self-Financing", intake: 60, fee: 52000, nep: true, mee: true, internship: true, minor: false, remarks: "Lateral entry permitted in 2nd year." },
    { name: "Ph.D. (Information Technology)", yearOfCommencement: 2015, mode: "Regular", intake: 8, fee: 25000, nep: false, mee: false, internship: false, minor: false, remarks: "Four supervisors currently recognised." },
  ],
  ece: [
    { name: "B.Tech. (Electronics & Communication Engineering)", yearOfCommencement: 1999, mode: "Regular (Aided)", intake: 90, fee: 61000, nep: true, mee: true, internship: true, minor: true, remarks: "NBA accreditation valid up to 2027." },
    { name: "B.Tech. (Electronics & VLSI Design)", yearOfCommencement: 2024, mode: "Self-Financing", intake: 40, fee: 74000, nep: true, mee: true, internship: true, minor: false, remarks: "Started under India Semiconductor Mission tie-up." },
    { name: "M.Tech. (Digital Communication Systems)", yearOfCommencement: 2012, mode: "Regular (Aided)", intake: 18, fee: 40000, nep: true, mee: false, internship: false, minor: false, remarks: "Under-subscribed in 2024; recovered in 2026." },
    { name: "M.Tech. (VLSI & Embedded Systems)", yearOfCommencement: 2016, mode: "Self-Financing", intake: 15, fee: 46000, nep: true, mee: false, internship: true, minor: false, remarks: "Shared laboratory with VLSI B.Tech. programme." },
    { name: "Ph.D. (Electronics Engineering)", yearOfCommencement: 2010, mode: "Regular", intake: 10, fee: 25000, nep: false, mee: false, internship: false, minor: false, remarks: "Two candidates awarded in 2025-26." },
  ],
  me: [
    { name: "B.Tech. (Mechanical Engineering)", yearOfCommencement: 1998, mode: "Regular (Aided)", intake: 90, fee: 61000, nep: true, mee: true, internship: true, minor: true, remarks: "Oldest programme of the faculty." },
    { name: "B.Tech. (Mechatronics & Automation)", yearOfCommencement: 2023, mode: "Self-Financing", intake: 40, fee: 69000, nep: true, mee: true, internship: true, minor: true, remarks: "Robotics lab commissioned in 2025." },
    { name: "M.Tech. (Thermal Engineering)", yearOfCommencement: 2013, mode: "Regular (Aided)", intake: 18, fee: 40000, nep: true, mee: false, internship: false, minor: false, remarks: "Admissions through GATE / university test." },
    { name: "M.Tech. (Production & Industrial Engineering)", yearOfCommencement: 2017, mode: "Self-Financing", intake: 15, fee: 45000, nep: false, mee: false, internship: false, minor: false, remarks: "NEP alignment proposal pending with Board of Studies." },
    { name: "Diploma (Machine Design — Bridge Course)", yearOfCommencement: 2021, mode: "Self-Financing", intake: 30, fee: 22000, nep: true, mee: true, internship: true, minor: false, remarks: "Lateral entry feeder to B.Tech. 2nd year." },
    { name: "Ph.D. (Mechanical Engineering)", yearOfCommencement: 2009, mode: "Regular", intake: 10, fee: 25000, nep: false, mee: false, internship: false, minor: false, remarks: "Three supervisors with active sponsored projects." },
  ],
};

function buildPrograms(): Program[] {
  const out: Program[] = [];
  for (const [deptId, list] of Object.entries(seeds)) {
    list.forEach((s, i) => {
      const r = makeRng(hashString(`${deptId}-prog-${i}`));
      const intake2024 = s.intake - (chance(r, 0.35) ? int(r, 0, 6) : 0);
      const intake2025 = s.intake;
      const intake2026 = s.intake + (chance(r, 0.3) ? int(r, 0, 12) : 0);
      const fill = () => 0.62 + r() * 0.38;
      const started = s.yearOfCommencement;
      const admitted = (year: number, sanctioned: number) =>
        year < started ? 0 : Math.min(sanctioned, Math.round(sanctioned * fill()));
      out.push({
        id: `${deptId}-p${i + 1}`,
        deptId,
        sNo: i + 1,
        name: s.name,
        yearOfCommencement: started,
        modeOfProgramme: s.mode,
        sanctionedFacultyPositions: {
          professor: int(r, 1, 3),
          associateProfessor: int(r, 1, 4),
          assistantProfessor: int(r, 3, 10),
        },
        semesterFeeByYear: {
          y2024: Math.round(s.fee * 0.92),
          y2025: Math.round(s.fee * 0.96),
          y2026: s.fee,
        },
        sanctionedIntakeByYear: { y2024: intake2024, y2025: intake2025, y2026: intake2026 },
        admittedByYear: {
          y2024: admitted(2024, intake2024),
          y2025: admitted(2025, intake2025),
          y2026: admitted(2026, intake2026),
        },
        nepAligned: s.nep,
        multipleEntryExit: s.mee,
        internshipEndOfYear: s.internship,
        minorSpecialisationAvailable: s.minor,
        remarks: s.remarks,
      });
    });
  }
  return out;
}

export const programs: Program[] = buildPrograms();

export const programsByDept = (deptId: string) =>
  programs.filter((p) => p.deptId === deptId);
