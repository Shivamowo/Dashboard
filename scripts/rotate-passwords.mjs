// Rotates EVERY real login's password (demo-* test accounts are skipped), forces a
// password change at next sign-in, and writes two files in the repo root (both gitignored):
//   credentials-export.csv  all accounts incl. faculty (kept private)
//   credentials-staff.csv   everyone EXCEPT faculty — the list to distribute
// Usage (from the Dashboard folder):  node scripts/rotate-passwords.mjs
import fs from "node:fs";
import { randomBytes } from "node:crypto";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const newPassword = () => "Vbspu@" + Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

async function j(res) { if (!res.ok) throw new Error(`${res.status} ${await res.text()}`); return res.json(); }

let users = [];
for (let page = 1; ; page++) {
  const d = await j(await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: H }));
  users.push(...d.users);
  if (d.users.length < 200) break;
}
const profiles = await j(await fetch(`${url}/rest/v1/profiles?select=id,role,display_name`, { headers: H }));
const byId = new Map(profiles.map((p) => [p.id, p]));

const rows = [];
let failed = 0;
for (const u of users) {
  const p = byId.get(u.id);
  if (!p || !u.email || /^demo-/i.test(u.email)) continue;
  const password = newPassword();
  const r1 = await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: "PUT", headers: H, body: JSON.stringify({ password }) });
  const r2 = await fetch(`${url}/rest/v1/profiles?id=eq.${u.id}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ must_change_password: true }) });
  if (!r1.ok || !r2.ok) { failed++; console.error("FAILED", u.email, r1.status, r2.status); continue; }
  rows.push({ email: u.email, password, role: p.role, name: p.display_name, fix: /^hod\./i.test(u.email) });
}
const order = { vc: 0, registrar: 1, admin: 2, et: 3, hod: 4, faculty: 5 };
rows.sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.name.localeCompare(b.name));
const write = (file, list) =>
  fs.writeFileSync(new URL(`../${file}`, import.meta.url),
    "email,temp_password,role,name,needs_real_name_fix\n" +
    list.map((r) => [csvCell(r.email), csvCell(r.password), csvCell(r.role), csvCell(r.name), r.fix].join(",")).join("\n") + "\n");
write("credentials-export.csv", rows);
write("credentials-staff.csv", rows.filter((r) => r.role !== "faculty"));
console.log({ rotated: rows.length, staff: rows.filter((r) => r.role !== "faculty").length, failed });
