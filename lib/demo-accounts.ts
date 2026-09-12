import type { Role } from "@/data";

/**
 * DEMO-ONLY MOCK AUTHENTICATION — NOT FOR PRODUCTION.
 *
 * Passwords are compared in plain text with no hashing, and the "session" is
 * an unsigned cookie holding a user id and role. There is no password reset,
 * no expiry and no CSRF protection. Real accounts (including self-service
 * signups) live in data/store.ts; this file only holds display data for the
 * login page's list of demo accounts, route-home mapping and role validation.
 * Replace the whole module with a real identity provider before any real use.
 */
export interface DemoAccount {
  username: string;
  role: Role;
  displayName: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "vc-demo", role: "vc", displayName: "Vice Chancellor" },
  { username: "registrar-demo", role: "registrar", displayName: "Registrar" },
  { username: "hod-demo", role: "hod", displayName: "Head of Department" },
  { username: "faculty-demo", role: "faculty", displayName: "Faculty Member" },
  { username: "et-demo", role: "et", displayName: "Engineering & Technical" },
  { username: "admin-demo", role: "admin", displayName: "Administrator" },
];

export const SESSION_COOKIE = "session";

export const ROLE_HOME: Record<Role, string> = {
  vc: "/vc",
  registrar: "/registrar",
  hod: "/hod",
  faculty: "/faculty",
  et: "/et",
  admin: "/admin",
};

export const isRole = (v: string | undefined): v is Role =>
  v === "vc" || v === "registrar" || v === "hod" || v === "faculty" || v === "et" || v === "admin";
