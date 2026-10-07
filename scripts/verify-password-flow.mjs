// Checks the Supabase side of "change password" end to end, using the demo-admin test
// account: sign in -> change password (as the user, like the app does) -> old password
// rejected -> new password works -> change it back.
// Usage (from the Dashboard folder):  node scripts/verify-password-flow.mjs
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = "demo-admin@vbspu.ac.in", ORIGINAL = "TestDemo@123", TEMP = "TempCheck@98765";

const signIn = async (password) => {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password }),
  });
  return r.ok ? (await r.json()).access_token : null;
};
const setPassword = (token, password) =>
  fetch(`${url}/auth/v1/user`, { method: "PUT", headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });

const results = [];
const check = (name, ok) => { results.push(ok); console.log(ok ? "PASS" : "FAIL", name); };

const t1 = await signIn(ORIGINAL);
check("sign in with current password", !!t1);
if (!t1) process.exit(1);
check("change password while signed in", (await setPassword(t1, TEMP)).ok);
check("old password is rejected", (await signIn(ORIGINAL)) === null);
const t2 = await signIn(TEMP);
check("new password works", !!t2);
if (t2) check("change it back", (await setPassword(t2, ORIGINAL)).ok);
check("original password works again", !!(await signIn(ORIGINAL)));
process.exit(results.every(Boolean) ? 0 : 1);
