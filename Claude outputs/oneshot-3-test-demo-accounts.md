# One-shot prompt #3 — paste into Cursor / Claude Code in the Dashboard repo root

Create 3 disposable demo/test accounts for an end-to-end walkthrough — one VC, one Admin, one Faculty. These are throwaway, clearly separate from the 183 real accounts, and must be deletable in one command when the demo is done. Act directly, no confirmation prompts.

## 1. New script: `scripts/create-test-accounts.ts`

Creates exactly these 3 Supabase Auth users (don't touch the real `create-logins.ts` flow or its email-assignment mapping file — this is a separate, parallel script):

| Role | Email | Password | Display name |
|---|---|---|---|
| vc | `demo-vc@vbspu.com` | `TestDemo@123` | TEST DEMO — Vice Chancellor |
| admin | `demo-admin@vbspu.com` | `TestDemo@123` | TEST DEMO — Administrator |
| faculty | `demo-faculty@vbspu.com` | `TestDemo@123` | TEST DEMO — Faculty |

For each: `supabase.auth.admin.createUser({ email, password, email_confirm: true })`, then insert a `profiles` row (role, display_name as above) with **`must_change_password = false`** — skip the forced-change flow for these three specifically, so the demo login is instant. Tag every row created by this script so it's unambiguous later which rows belong to it — e.g. a `display_name` prefix of `TEST DEMO —` (as above) is enough; don't add a new schema column just for this.

## 2. Dummy Faculty record for the faculty demo account

The faculty test account needs its own record to view (research, projects, targets, department page) without touching any real person's data:

- Insert one new row into the `faculty` table: `id: "test-demo-faculty"`, `name: "TEST DEMO — Faculty"`, `departments: ["cse"]` (or any single real department id — pick one that already has programmes/infrastructure seeded so the demo view isn't empty), `primaryDepartment` matching, and reasonable non-null placeholder values for the fields the UI reads (designation, qualification, etc.) so the profile page doesn't look broken.
- Also insert one row each into `faculty_research`, `faculty_projects`, `faculty_targets` for `test-demo-faculty` with a few realistic placeholder numbers, so the demo shows populated charts/tables, not empty states.
- Link the `demo-faculty@vbspu.com` profile's `faculty_id` to `"test-demo-faculty"`.
- This record must NOT go into `data/imported/faculty.json` or any file touched by `npm run import:excel` — it's Supabase-only, created and deleted by these two scripts alone, so a real data refresh never touches it.

## 3. New script: `scripts/remove-test-accounts.ts`

Clean teardown, run when the demo is done:
- Delete the 3 auth users (`supabase.auth.admin.deleteUser`) — cascades to their `profiles` rows if the foreign key is `on delete cascade`; otherwise delete `profiles` rows explicitly first.
- Delete the `test-demo-faculty` rows from `faculty_research`, `faculty_projects`, `faculty_targets`, then `faculty` itself, then any `faculty_departments` join rows for it.
- Print a confirmation of what was deleted.

## 4. Output

After running `create-test-accounts.ts`, print the 3 logins (email + password) to the console and also write them to `test-accounts-credentials.txt` in the repo root (add to `.gitignore` — never commit it). Confirm all three log in successfully against the deployed app and land on the correct role home page with populated (non-empty) data.
