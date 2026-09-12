import { cookies } from "next/headers";
import type { Role } from "@/data";
import { SESSION_COOKIE, isRole } from "./demo-accounts";

/** Reads the demo session cookie. Mock auth — see lib/demo-accounts.ts. */
export function getSessionRole(): Role | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return isRole(value) ? value : null;
}
