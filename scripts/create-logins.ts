/**
 * Creates/updates one real Supabase Auth login per person: every row in
 * data/imported/faculty.json, one HoD account per department, and one each
 * for vc/registrar/et/admin.
 *
 *   npx tsx scripts/create-logins.ts
 *
 * Email scheme (@vbspu.ac.in):
 *  - Real name on file: strip a leading title (Dr./Prof./Mr./Mrs./Ms./Miss),
 *    take the first word of what's left, lowercase its first 4 letters (or
 *    the whole word if shorter) — "Dr. Ashutosh Kumar Singh" -> "ashu".
 *  - Singleton role accounts (vc/registrar/et/admin, no personal name yet):
 *    fixed stems "vice"/"regi"/"engi"/"admi".
 *  - HoD accounts for a department with no real HoD name on file yet: an
 *    interim "hod.<dept-short-name>" address, flagged needsRealNameFix so it
 *    can be corrected once a real name is known.
 *  - Collisions on the 4-letter stem get an incrementing digit (ashu, ashu2,
 *    ashu3, ...), assigned in a fixed order (roles, then HoDs by dept id,
 *    then faculty by faculty id) so it's deterministic.
 *
 * Every assignment is persisted to data/imported/email-assignments.json
 * (accountId -> {email, needsRealNameFix}) and reused on every re-run, so an
 * existing person's address never reshuffles — only new people get a new one.
 *
 * Idempotent and non-destructive for people who already have an auth account:
 * this NEVER deletes/recreates an existing user (that would orphan their
 * profiles row and everything linked to it). Existing accounts only have
 * their email migrated to the new scheme via updateUserById — their password
 * is left untouched. Only brand-new accounts get a freshly generated temp
 * password. Every account processed here (new or existing) gets
 * must_change_password = true, since none of them have set their own
 * password yet.
 *
 * Run supabase/schema.sql, supabase/migrations/0002_auth_and_workflow.sql,
 * supabase/migrations/0003_must_change_password.sql and
 * scripts/seed-supabase.ts first — faculty/department rows must exist before
 * profiles can reference them.
 */
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";
import faculty from "../data/imported/faculty.json";
import departments from "../data/imported/departments.json";

const DOMAIN = "vbspu.ac.in";
const ASSIGNMENTS_PATH = path.resolve(__dirname, "..", "data", "imported", "email-assignments.json");
const CSV_PATH = path.resolve(__dirname, "..", "credentials-export.csv");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/* ------------------------------------------------------------ email scheme */

interface Assignment {
  email: string;
  needsRealNameFix: boolean;
}
type Assignments = Record<string, Assignment>;

function loadAssignments(): Assignments {
  try {
    return JSON.parse(fs.readFileSync(ASSIGNMENTS_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function saveAssignments(a: Assignments) {
  fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(a, null, 2) + "\n", "utf-8");
}

const TITLE_RE = /^\(?(dr|prof|professor|mr|mrs|ms|miss)\.?\)?\s+/i;
function stripTitle(name: string): string {
  let s = name.trim();
  while (TITLE_RE.test(s)) s = s.replace(TITLE_RE, "").trim();
  return s;
}
/** First name, lowercased, first 4 letters (or the whole word if shorter). */
function nameStem(name: string): string {
  const first = stripTitle(name).split(/\s+/)[0] ?? name;
  const clean = first.toLowerCase().replace(/[^a-z]/g, "");
  return (clean.slice(0, 4) || "user");
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function claimEmail(stem: string, used: Set<string>): string {
  let candidate = `${stem}@${DOMAIN}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${stem}${n}@${DOMAIN}`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

/** Reuses a persisted assignment for `id` if there is one; otherwise computes
 * a fresh one (claiming it against `used`) and persists it. */
function resolveEmail(
  assignments: Assignments,
  used: Set<string>,
  id: string,
  stem: string,
  needsRealNameFix: boolean
): string {
  const existing = assignments[id];
  if (existing) return existing.email;
  const email = claimEmail(stem, used);
  assignments[id] = { email, needsRealNameFix };
  return email;
}

/* -------------------------------------------------------------- CSV in/out */

interface CsvRow {
  email: string;
  password: string;
  role: string;
  name: string;
  needsRealNameFix: boolean;
}

function loadOldPasswordsByEmail(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(CSV_PATH)) return map;
  const lines = fs.readFileSync(CSV_PATH, "utf-8").trim().split("\n").slice(1);
  for (const line of lines) {
    // email, temp_password, role, "name", flag — name may contain commas inside quotes.
    const m = line.match(/^([^,]*),([^,]*),([^,]*),"((?:[^"]|"")*)",(\w+)$/);
    if (!m) continue;
    const [, email, password] = m;
    if (email && password) map.set(email.toLowerCase(), password);
  }
  return map;
}

function writeCsv(rows: CsvRow[]) {
  const header = "email,temp_password,role,name,needs_real_name_fix\n";
  const body = rows
    .map((r) =>
      [r.email, r.password, r.role, `"${r.name.replace(/"/g, '""')}"`, r.needsRealNameFix].join(",")
    )
    .join("\n");
  fs.writeFileSync(CSV_PATH, header + body + "\n", "utf-8");
}

/* --------------------------------------------------------------- Supabase */

function tempPassword(): string {
  return "Vbspu@" + Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
}

interface AccountSpec {
  id: string;
  email: string;
  role: string;
  name: string;
  needsRealNameFix: boolean;
  extra: { dept_id?: string; faculty_id?: string };
}

async function main() {
  const assignments = loadAssignments();
  const used = new Set(Object.values(assignments).map((a) => a.email));
  const oldPasswords = loadOldPasswordsByEmail();

  // --- Build the full account list (fixed order: roles, HoDs, faculty) ---
  const specs: AccountSpec[] = [];

  const ROLE_STEMS: Record<string, string> = { vc: "vice", registrar: "regi", et: "engi", admin: "admi" };
  for (const role of ["vc", "registrar", "et", "admin"] as const) {
    const id = `role:${role}`;
    const email = resolveEmail(assignments, used, id, ROLE_STEMS[role], false);
    specs.push({ id, email, role, name: role.toUpperCase(), needsRealNameFix: false, extra: {} });
  }

  const sortedDepts = [...(departments as any[])].sort((a, b) => a.id.localeCompare(b.id));
  for (const d of sortedDepts) {
    const id = `hod:${d.id}`;
    const hasRealName = Boolean(d.hodName);
    const stem = hasRealName ? nameStem(d.hodName) : `hod.${slug(d.shortName || d.id)}`;
    const email = resolveEmail(assignments, used, id, stem, !hasRealName);
    specs.push({
      id,
      email,
      role: "hod",
      name: d.hodName || `HoD, ${d.name}`,
      needsRealNameFix: assignments[id].needsRealNameFix,
      extra: { dept_id: d.id },
    });
  }

  const sortedFaculty = [...(faculty as any[])].sort((a, b) => a.id.localeCompare(b.id));
  for (const f of sortedFaculty) {
    const id = f.id;
    const email = resolveEmail(assignments, used, id, nameStem(f.name), false);
    specs.push({
      id,
      email,
      role: "faculty",
      name: f.name,
      needsRealNameFix: false,
      extra: { dept_id: f.primaryDepartment, faculty_id: f.id },
    });
  }

  saveAssignments(assignments);

  // --- Resolve each account's existing auth uid (if any) via profiles ---
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id,role,dept_id,faculty_id");
  if (profilesError) throw profilesError;

  const roleUid = new Map<string, string>();
  const hodUid = new Map<string, string>();
  const facultyUid = new Map<string, string>();
  for (const p of (profiles as any[]) ?? []) {
    if (["vc", "registrar", "et", "admin"].includes(p.role) && !roleUid.has(p.role)) roleUid.set(p.role, p.id);
    if (p.role === "hod" && p.dept_id && !hodUid.has(p.dept_id)) hodUid.set(p.dept_id, p.id);
    if (p.role === "faculty" && p.faculty_id) facultyUid.set(p.faculty_id, p.id);
  }
  const uidFor = (spec: AccountSpec): string | undefined => {
    if (spec.role === "hod") return hodUid.get(spec.extra.dept_id!);
    if (spec.role === "faculty") return facultyUid.get(spec.extra.faculty_id!);
    return roleUid.get(spec.role);
  };

  // Current (pre-migration) email per uid, to recover an existing account's
  // still-valid password from the last credentials-export.csv without
  // resetting it.
  const emailByUid = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) emailByUid.set(u.id, u.email);
    if (data.users.length < 1000) break;
    page++;
  }

  // --- Create or migrate each account ---
  const rows: CsvRow[] = [];
  let created = 0;
  let migrated = 0;
  let collisions = 0;
  for (const key of Object.keys(assignments)) {
    if (assignments[key].email.match(/\d@/)) collisions++;
  }

  for (const spec of specs) {
    const uid = uidFor(spec);

    if (!uid) {
      const password = tempPassword();
      const { data: createdUser, error } = await db.auth.admin.createUser({
        email: spec.email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`  FAILED to create ${spec.email}: ${error.message}`);
        continue;
      }
      const { error: profileError } = await db.from("profiles").insert({
        id: createdUser.user!.id,
        role: spec.role,
        dept_id: spec.extra.dept_id ?? null,
        faculty_id: spec.extra.faculty_id ?? null,
        display_name: spec.name,
        status: "active",
        must_change_password: true,
      });
      if (profileError) {
        console.error(`  profile FAILED for ${spec.email}: ${profileError.message}`);
        await db.auth.admin.deleteUser(createdUser.user!.id);
        continue;
      }
      console.log(`  created: ${spec.email} (${spec.role})`);
      created++;
      rows.push({ email: spec.email, password, role: spec.role, name: spec.name, needsRealNameFix: spec.needsRealNameFix });
      continue;
    }

    const currentEmail = emailByUid.get(uid);
    if (currentEmail && currentEmail.toLowerCase() !== spec.email.toLowerCase()) {
      const { error } = await db.auth.admin.updateUserById(uid, { email: spec.email, email_confirm: true });
      if (error) {
        console.error(`  email migration FAILED for ${spec.id} (${currentEmail} -> ${spec.email}): ${error.message}`);
        continue;
      }
      console.log(`  migrated: ${currentEmail} -> ${spec.email}`);
      migrated++;
    }
    const { error: profileError } = await db
      .from("profiles")
      .update({ must_change_password: true, display_name: spec.name })
      .eq("id", uid);
    if (profileError) console.error(`  profile update FAILED for ${spec.email}: ${profileError.message}`);

    const knownPassword = currentEmail ? oldPasswords.get(currentEmail.toLowerCase()) : undefined;
    let password = knownPassword;
    if (!password) {
      // No record of this account's current password (shouldn't happen for
      // anything create-logins.ts created before) — reset it as a last
      // resort so the CSV isn't wrong, rather than silently omitting it.
      password = tempPassword();
      const { error } = await db.auth.admin.updateUserById(uid, { password });
      if (error) {
        console.error(`  password reset FAILED for ${spec.email}: ${error.message}`);
        password = "(unknown — reset manually)";
      } else {
        console.warn(`  WARNING: no known password for ${spec.email}; generated a new one.`);
      }
    }
    rows.push({ email: spec.email, password, role: spec.role, name: spec.name, needsRealNameFix: spec.needsRealNameFix });
  }

  writeCsv(rows);
  const needsFix = rows.filter((r) => r.needsRealNameFix).length;
  console.log(`\n${created} created, ${migrated} email(s) migrated, ${rows.length} total accounts.`);
  console.log(`${collisions} stem collision(s) resolved with a suffix digit.`);
  console.log(`${needsFix} row(s) flagged needs_real_name_fix — no real HoD name on file yet.`);
  console.log(`Wrote ${CSV_PATH} (gitignored — do not commit).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
