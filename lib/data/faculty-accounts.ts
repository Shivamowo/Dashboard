import "server-only";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-creates a faculty member's login (Supabase Auth user + profiles row).
 * Email scheme (same as scripts/create-logins.ts): first 4 letters of the first
 * name @vbspu.ac.in, with an incrementing digit on collision (ashu, ashu2, …).
 * Uniqueness is checked against the live auth user list, so it works on a
 * read-only deployment (no JSON file writes).
 */
export const EMAIL_DOMAIN = "vbspu.ac.in";

const TITLE_RE = /^\(?(dr|prof|professor|mr|mrs|ms|miss)\.?\)?\s+/i;
const stripTitle = (name: string) => {
  let s = name.trim();
  while (TITLE_RE.test(s)) s = s.replace(TITLE_RE, "").trim();
  return s;
};
export function emailStem(name: string): string {
  const first = stripTitle(name).split(/\s+/)[0] ?? name;
  return first.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4) || "user";
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alike characters
export function generatePassword(): string {
  const bytes = randomBytes(8);
  return "Vbspu@" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function takenEmails(): Promise<Set<string>> {
  const db = createSupabaseAdminClient();
  const taken = new Set<string>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) taken.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
  }
  return taken;
}

export async function createFacultyLogin(input: {
  facultyId: string;
  name: string;
  deptId: string;
}): Promise<{ email: string; password: string }> {
  const db = createSupabaseAdminClient();
  const stem = emailStem(input.name);
  const taken = await takenEmails();
  const password = generatePassword();

  let n = 1;
  for (let attempt = 0; attempt < 8; attempt++) {
    let email = `${stem}${n === 1 ? "" : n}@${EMAIL_DOMAIN}`;
    while (taken.has(email)) {
      n++;
      email = `${stem}${n}@${EMAIL_DOMAIN}`;
    }
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      // Lost a race for the same address — take the next one.
      if (/already|registered|exists/i.test(error.message)) {
        taken.add(email);
        continue;
      }
      throw error;
    }
    const { error: profileError } = await db.from("profiles").insert({
      id: data.user!.id,
      role: "faculty",
      dept_id: input.deptId,
      faculty_id: input.facultyId,
      display_name: input.name,
      status: "active",
      must_change_password: true,
    });
    if (profileError) {
      await db.auth.admin.deleteUser(data.user!.id);
      throw profileError;
    }
    return { email, password };
  }
  throw new Error("Could not find a free email address.");
}
