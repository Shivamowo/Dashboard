import type { Infrastructure } from "./types";
import { makeRng, hashString, int, pick, chance } from "./rng";
import { facultyByDept } from "./faculty";
import { programsByDept } from "./programs";
import { globalSingleton } from "./globalStore";
import { chooseData, imported } from "./source";

type RoomSeed = { room: string; floor: string; capacity: number; equipment: string };

const roomSeeds: Record<string, RoomSeed[]> = {
  cse: [
    { room: "Programming Laboratory - I", floor: "GF, CS-101", capacity: 60, equipment: "60 desktops (i5 12th gen, 16 GB RAM), 1 Gbps LAN, UPS backup" },
    { room: "Programming Laboratory - II", floor: "GF, CS-102", capacity: 60, equipment: "60 desktops (i5 11th gen), managed switch, AC" },
    { room: "AI / ML Research Laboratory", floor: "FF, CS-206", capacity: 30, equipment: "2 GPU workstations (RTX 4090), 28 thin clients, NAS 40 TB" },
    { room: "Data Science Laboratory", floor: "FF, CS-207", capacity: 40, equipment: "40 desktops, Hadoop cluster (5 nodes), Tableau licences" },
    { room: "Network & Cloud Laboratory", floor: "FF, CS-208", capacity: 35, equipment: "Cisco routers/switches, 2 rack servers, virtualisation host" },
    { room: "Project & Innovation Laboratory", floor: "SF, CSE-303", capacity: 25, equipment: "Arduino / Raspberry Pi kits, 3D printer, soldering stations" },
    { room: "Lecture Hall CSE-304", floor: "SF, CSE-304", capacity: 120, equipment: "Smart board, podium PC, PA system" },
    { room: "Lecture Hall CSE-305", floor: "SF, CSE-305", capacity: 120, equipment: "Projector, PA system, tiered seating" },
    { room: "Tutorial Room CSE-306", floor: "SF, CSE-306", capacity: 45, equipment: "Whiteboard, projector" },
    { room: "Departmental Seminar Room", floor: "SF, Seminar Room 204", capacity: 80, equipment: "Video conferencing unit, smart board, recording setup" },
    { room: "Departmental Library & Reading Room", floor: "GF, CS-104", capacity: 30, equipment: "Reference collection, 4 OPAC terminals" },
  ],
  it: [
    { room: "IT Computing Laboratory - I", floor: "GF, IT-107", capacity: 60, equipment: "60 desktops (i5), gigabit LAN, AC" },
    { room: "IT Computing Laboratory - II", floor: "GF, IT-108", capacity: 55, equipment: "55 desktops, Linux / Windows dual boot" },
    { room: "Cyber Security Laboratory", floor: "GF, IT-109", capacity: 30, equipment: "Isolated test-bed network, 30 nodes, forensic workstation" },
    { room: "MCA Application Laboratory", floor: "FF, IT-203", capacity: 60, equipment: "60 desktops, MSDN academic licences" },
    { room: "Software Project Laboratory", floor: "FF, IT-204", capacity: 30, equipment: "30 workstations, CI server, test devices" },
    { room: "Lecture Hall IT-205", floor: "FF, IT-205", capacity: 100, equipment: "Smart board, podium PC" },
    { room: "Lecture Hall IT-206", floor: "FF, IT-206", capacity: 100, equipment: "Projector, PA system" },
    { room: "Tutorial Room IT-110", floor: "GF, IT-110", capacity: 40, equipment: "Whiteboard, projector" },
    { room: "IT Seminar Hall", floor: "SF, IT-301", capacity: 90, equipment: "Video conferencing, smart board" },
    { room: "Research Scholars Room", floor: "SF, IT-302", capacity: 12, equipment: "12 workstations, printer, reference books" },
  ],
  ece: [
    { room: "Basic Electronics Laboratory", floor: "GF, EC-101", capacity: 40, equipment: "CROs, function generators, DC power supplies, trainer kits" },
    { room: "Digital Electronics Laboratory", floor: "GF, EC-102", capacity: 40, equipment: "Digital trainer kits, logic analysers, FPGA boards" },
    { room: "Communication Systems Laboratory", floor: "FF, EC-201", capacity: 35, equipment: "Spectrum analyser, modulation trainers, optical fibre kits" },
    { room: "VLSI Design Laboratory", floor: "FF, EC-202", capacity: 30, equipment: "30 workstations, Cadence / Synopsys EDA licences" },
    { room: "Embedded Systems Laboratory", floor: "FF, EC-203", capacity: 30, equipment: "ARM / PIC dev boards, JTAG debuggers, IoT kits" },
    { room: "Microwave & Antenna Laboratory", floor: "SF, EC-301", capacity: 25, equipment: "Vector network analyser, anechoic test bench, klystron bench" },
    { room: "Signal Processing Laboratory", floor: "SF, EC-302", capacity: 30, equipment: "DSP kits (TMS320), MATLAB licences" },
    { room: "Lecture Hall EC-105", floor: "GF, EC-105", capacity: 110, equipment: "Smart board, PA system" },
    { room: "Lecture Hall EC-204", floor: "FF, EC-204", capacity: 110, equipment: "Projector, PA system" },
    { room: "Project Laboratory", floor: "SF, EC-303", capacity: 20, equipment: "PCB prototyping unit, 3D printer, test instruments" },
    { room: "ECE Seminar Room", floor: "SF, EC-304", capacity: 70, equipment: "Video conferencing, projector" },
  ],
  me: [
    { room: "Thermal Engineering Laboratory", floor: "GF, ME-Shed-1", capacity: 30, equipment: "IC engine test rigs, calorimeters, boiler model" },
    { room: "Fluid Mechanics Laboratory", floor: "GF, ME-Shed-2", capacity: 30, equipment: "Venturimeter, orifice bench, pump / turbine test rigs" },
    { room: "Machine Shop / Workshop", floor: "GF, Workshop Block", capacity: 45, equipment: "Lathes, milling machines, welding bays, foundry section" },
    { room: "CAD / CAM Laboratory", floor: "FF, ME-201", capacity: 40, equipment: "40 workstations, SolidWorks / ANSYS licences, CNC simulator" },
    { room: "Strength of Materials Laboratory", floor: "GF, ME-103", capacity: 30, equipment: "UTM 40T, impact tester, hardness testers" },
    { room: "Robotics & Mechatronics Laboratory", floor: "FF, ME-202", capacity: 25, equipment: "6-axis robotic arm, PLC trainers, pneumatic bench" },
    { room: "Metrology & Measurement Laboratory", floor: "GF, ME-104", capacity: 30, equipment: "Profile projector, slip gauges, coordinate measuring machine" },
    { room: "Refrigeration & AC Laboratory", floor: "GF, ME-105", capacity: 25, equipment: "Vapour compression test rig, ice plant, psychrometric unit" },
    { room: "Lecture Hall ME-106", floor: "GF, ME-106", capacity: 120, equipment: "Smart board, PA system" },
    { room: "Lecture Hall ME-203", floor: "FF, ME-203", capacity: 120, equipment: "Projector" },
    { room: "Design Project Room", floor: "FF, ME-204", capacity: 20, equipment: "Drafting tables, 3D printer, model display" },
    { room: "ME Seminar Hall", floor: "SF, ME-301", capacity: 80, equipment: "Video conferencing, smart board" },
  ],
};

const supportStaff = [
  "Sh. Ram Lal (Lab Technician)",
  "Sh. Mohan Prasad (Lab Assistant)",
  "Sh. Sant Kumar (Technical Assistant)",
  "Smt. Rekha Devi (Lab Attendant)",
  "Sh. Jai Prakash (Lab Technician)",
  "Sh. Ashok Sonkar (Lab Attendant)",
  "Vacant",
];

function buildInfrastructure(): Infrastructure[] {
  const rows: Infrastructure[] = [];
  for (const [deptId, seeds] of Object.entries(roomSeeds)) {
    const staffNames = facultyByDept(deptId).map((f) => f.name);
    const progs = programsByDept(deptId).map((p) => p.name);
    seeds.forEach((s, i) => {
      const r = makeRng(hashString(deptId + "-infra-" + i));
      const allotted = int(r, 18, 40);
      const isHall = /Lecture Hall|Seminar|Tutorial|Library|Scholars/.test(s.room);
      const used = Math.max(
        4,
        Math.min(allotted + int(r, 0, 6), Math.round(allotted * (isHall ? 0.55 + r() * 0.75 : 0.65 + r() * 0.6)))
      );
      const utilisation = Math.round((used / allotted) * 100);
      const using = [progs[i % progs.length], progs[(i + 1) % progs.length]]
        .filter(Boolean)
        .filter((v, k, a) => a.indexOf(v) === k)
        .join(", ");
      rows.push({
        id: deptId + "-i" + (i + 1),
        deptId,
        sNo: i + 1,
        labClassroomName: s.room,
        floorRoomNo: s.floor,
        hoursAllottedPerWeek: allotted,
        currentWeeklyWorkingHours: used,
        labRoomInCharge: staffNames[(i * 3) % staffNames.length] ?? "To be assigned",
        labAssistantSupportStaff: pick(r, supportStaff),
        studentCapacity: s.capacity,
        majorEquipmentAvailable: s.equipment,
        programmesUsingFacility: using,
        utilisationPct: utilisation,
        digitalSmartBoard: /Smart board/i.test(s.equipment) ? true : chance(r, 0.35),
        projector: /Projector|Smart board|conferencing/i.test(s.equipment) ? true : chance(r, 0.6),
      });
    });
  }
  return rows;
}

export const infrastructure: Infrastructure[] = globalSingleton("infrastructure", () =>
  chooseData(imported.infrastructure, buildInfrastructure)
);

export const infrastructureByDept = (deptId: string) =>
  infrastructure.filter((x) => x.deptId === deptId);

export const infrastructureById = (id: string) => infrastructure.find((x) => x.id === id);

export type InfrastructureEdit = Omit<Infrastructure, "id" | "deptId" | "sNo">;

/** Applied on approval of an ET edit, or immediately for Admin. */
export function updateInfrastructureRecord(id: string, data: InfrastructureEdit) {
  const idx = infrastructure.findIndex((x) => x.id === id);
  if (idx >= 0) infrastructure[idx] = { ...infrastructure[idx], ...data };
}

export type UtilisationFlag = "Under-utilised" | "Optimal" | "Over-utilised";

/**
 * A room that never reported a utilisation figure has no flag — null, not
 * "Under-utilised". Treating a blank as 0% would brand every unreported room
 * as under-used and inflate the under-utilisation counts on the ET dashboard.
 */
export function utilisationFlag(pct: number | null | undefined): UtilisationFlag | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  if (pct < 60) return "Under-utilised";
  if (pct > 95) return "Over-utilised";
  return "Optimal";
}
