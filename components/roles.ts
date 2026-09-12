import type { Role } from "@/data";

export interface RoleMeta {
  id: Role;
  label: string;
  shortLabel: string;
  home: string;
  scope: string;
  /** lucide-react icon name, resolved in AppSidebar. */
  icon: "Landmark" | "ClipboardList" | "Users" | "UserRound" | "Wrench" | "ShieldCheck";
}

export const ROLES: RoleMeta[] = [
  {
    id: "vc",
    label: "Vice Chancellor",
    shortLabel: "VC",
    home: "/vc",
    scope: "Every department, with drill-down to any faculty member",
    icon: "Landmark",
  },
  {
    id: "registrar",
    label: "Registrar",
    shortLabel: "Registrar",
    home: "/registrar",
    scope: "Faculty register, submission compliance and programme statistics",
    icon: "ClipboardList",
  },
  {
    id: "hod",
    label: "Head of Department",
    shortLabel: "HoD",
    home: "/hod",
    scope: "One department — its faculty, programmes, targets and rooms",
    icon: "Users",
  },
  {
    id: "faculty",
    label: "Faculty Member",
    shortLabel: "Faculty",
    home: "/faculty",
    scope: "Your own record: research, projects and annual targets",
    icon: "UserRound",
  },
  {
    id: "et",
    label: "Engineering & Technical",
    shortLabel: "ET",
    home: "/et",
    scope: "Laboratories and classrooms across every department",
    icon: "Wrench",
  },
  {
    id: "admin",
    label: "Administrator",
    shortLabel: "Admin",
    home: "/admin",
    scope: "Every department and record, plus the edit-approval queue",
    icon: "ShieldCheck",
  },
];

export const roleMeta = (id: Role) => ROLES.find((r) => r.id === id) ?? ROLES[0];

export const roleForPath = (pathname: string): Role | null => {
  const seg = pathname.split("/").filter(Boolean)[0];
  const found = ROLES.find((r) => r.id === seg);
  return found ? found.id : null;
};

/** In-page section anchors shown under the active role in the sidebar. */
export const ROLE_SECTIONS: Record<Role, { id: string; label: string }[]> = {
  vc: [
    { id: "kpis", label: "University summary" },
    { id: "trends", label: "Intake & research trends" },
    { id: "comparison", label: "Department comparison" },
    { id: "compliance", label: "Submission compliance" },
  ],
  registrar: [
    { id: "kpis", label: "Register summary" },
    { id: "roster", label: "Faculty register" },
    { id: "compliance", label: "HoD compliance" },
    { id: "programmes", label: "Programme statistics" },
  ],
  hod: [
    { id: "kpis", label: "Department snapshot" },
    { id: "programmes", label: "Programmes" },
    { id: "roster", label: "Faculty roster" },
    { id: "targets", label: "Annual targets" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "submission", label: "HoD submission" },
  ],
  faculty: [
    { id: "identity", label: "Identity & teaching" },
    { id: "research", label: "Research output" },
    { id: "projects", label: "Sponsored projects" },
    { id: "targets", label: "Annual targets" },
  ],
  et: [
    { id: "kpis", label: "Estate summary" },
    { id: "trends", label: "Utilisation by department" },
    { id: "register", label: "Room register" },
  ],
  admin: [
    { id: "approvals", label: "Approval queue" },
    { id: "kpis", label: "University summary" },
    { id: "departments", label: "Departments" },
  ],
};
