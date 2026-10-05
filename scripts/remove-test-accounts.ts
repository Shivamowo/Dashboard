/**
 * Tears down everything scripts/create-test-accounts.ts created: the 3 demo
 * auth users (profiles cascade with them via the FK), and the dummy
 * "test-demo-faculty" faculty record (research/projects/targets/department
 * link, then the faculty row itself).
 *
 *   npx tsx scripts/remove-test-accounts.ts
 */
import * as dotenv from "dotenv";
import * as path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const TEST_FACULTY_ID = "test-demo-faculty";
const TEST_EMAILS = ["demo-vc@vbspu.ac.in", "demo-admin@vbspu.ac.in", "demo-faculty@vbspu.ac.in"];

async function main() {
  console.log("Removing test/demo accounts ...");

  const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  let deletedUsers = 0;
  for (const email of TEST_EMAILS) {
    const user = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      console.log(`  not found (already removed): ${email}`);
      continue;
    }
    // profiles.id references auth.users(id) ON DELETE CASCADE — deleting the
    // auth user removes the profile row too. Delete it explicitly first
    // anyway, in case that FK is ever changed to not cascade.
    await db.from("profiles").delete().eq("id", user.id);
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  FAILED to delete ${email}: ${error.message}`);
      continue;
    }
    console.log(`  deleted user: ${email}`);
    deletedUsers++;
  }

  console.log("Removing dummy faculty record " + TEST_FACULTY_ID + " ...");
  const { error: targetErr, count: targetCount } = await db
    .from("faculty_targets")
    .delete({ count: "exact" })
    .eq("faculty_id", TEST_FACULTY_ID);
  if (targetErr) throw targetErr;

  const { error: projErr, count: projCount } = await db
    .from("faculty_projects")
    .delete({ count: "exact" })
    .eq("faculty_id", TEST_FACULTY_ID);
  if (projErr) throw projErr;

  const { error: resErr, count: resCount } = await db
    .from("faculty_research")
    .delete({ count: "exact" })
    .eq("faculty_id", TEST_FACULTY_ID);
  if (resErr) throw resErr;

  const { error: deptLinkErr, count: deptLinkCount } = await db
    .from("faculty_departments")
    .delete({ count: "exact" })
    .eq("faculty_id", TEST_FACULTY_ID);
  if (deptLinkErr) throw deptLinkErr;

  const { error: facultyErr, count: facultyCount } = await db
    .from("faculty")
    .delete({ count: "exact" })
    .eq("id", TEST_FACULTY_ID);
  if (facultyErr) throw facultyErr;

  console.log(
    `\nDeleted: ${deletedUsers} auth user(s), ${facultyCount ?? 0} faculty row, ${deptLinkCount ?? 0} department link(s), ` +
      `${resCount ?? 0} research row, ${projCount ?? 0} project row(s), ${targetCount ?? 0} target row.`
  );
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
