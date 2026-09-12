import type { Role } from "@/data";

/**
 * DEMO-ONLY MOCK AUTHENTICATION — NOT FOR PRODUCTION.
 *
 * Credentials are hardcoded in source, passwords are compared in plain text with
 * no hashing, and the "session" is an unsigned cookie holding the role name.
 * There is no user store, no password reset, no expiry and no CSRF protection.
 * This exists purely so the frontend-only phase can demonstrate role scoping.
 * Replace the whole module with a real identity provider before any real use.
 */
export interface DemoAccount {
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "vc-demo", password: "demo123", role: "vc", displayName: "Vice Chancellor" },
  { username: "registrar-demo", password: "demo123", role: "registrar", displayName: "Registrar" },
  { username: "hod-demo", password: "demo123", role: "hod", displayName: "Head of Department" },
  { username: "faculty-demo", password: "demo123", role: "faculty", displayName: "Faculty Member" },
  { username: "et-demo", password: "demo123", role: "et", displayName: "Engineering & Technical" },
];

/** Plain-text credential check — demo only. */
export function findAccount(username: string, password: string): DemoAccount | undefined {
  const u = username.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.username === u && a.password === password);
}

export const SESSION_COOKIE = "session";

export const ROLE_HOME: Record<Role, string> = {
  vc: "/vc",
  registrar: "/registrar",
  hod: "/hod",
  faculty: "/faculty",
  et: "/et",
};

export const isRole = (v: string | undefined): v is Role =>
  v === "vc" || v === "registrar" || v === "hod" || v === "faculty" || v === "et";
