# One-shot prompt #2 — paste into Cursor / Claude Code in the Dashboard repo root

Three things, in one pass. Act directly, no confirmation prompts, minimize back-and-forth.

## A. Fix the split-departments.ts idempotency bug (don't work around it)

~50 faculty rows in `data/imported/faculty.json` still carry pre-split department ids (`cse-and-it`, `department-of-business-economics-and-department`, `department-of-electronics-engineering`, `biotechnology-microbiology-biochemistry`) even after the split runs. Find why `scripts/split-departments.ts`'s per-row `deptId`/`departments` reassignment doesn't catch every row on a fresh `npm run import:excel` (likely candidates: the dedupe/merge step unioning `departments[]` from a record that was matched before its own `deptId` got rewritten, or a record whose `departments` array was seeded with the combined-workbook id directly during import rather than picking it up from `deptId`) — fix it at the source so `data/imported/faculty.json` never contains a combined-workbook id after the script runs. Then delete the two remapping workarounds that were added to `scripts/seed-supabase.ts` and `scripts/create-logins.ts` to route around this — they should no longer be needed. Re-run `npm run import:excel` and confirm zero faculty rows reference any of the four combined ids.

## B. Change the email scheme for every account

Current: `name.slug@vbspu.local` placeholders. New rule, applied consistently everywhere an email is generated (`scripts/create-logins.ts` and anywhere else that builds a login email):

- **Real person, real name on file**: strip title prefixes (`Dr.`, `Dr`, `Prof.`, `Prof`, `Professor`, `Mr.`, `Mrs.`, `Ms.`, `Miss`) from the front of the name, take the first word (their given name) after stripping, lowercase its first 4 letters (or the whole word if shorter than 4), domain `@vbspu.com`. Example: "Dr. Ashutosh Kumar Singh" → `ashu@vbspu.com`.
- **Singleton role accounts with no personal name yet** (VC, Registrar, ET, Admin — currently named just "VC"/"REGISTRAR"/"ET"/"ADMIN" in the data): use the first 4 letters of the role label itself — `vice@vbspu.com` (Vice Chancellor), `regi@vbspu.com` (Registrar), `engi@vbspu.com` (Engineering & Technical), `admi@vbspu.com` (Admin).
- **Placeholder department-only names** (e.g. `"HoD, Biotechnology"` — no real person named yet): can't derive a real first name. Keep a clearly-marked interim address (`hod.bt@vbspu.com`) and flag these rows in the output (see part D) as "needs a real name before its email can be fixed" so they get corrected once the department fills in the real HoD's name.
- **Collisions**: many people will share a 4-letter stem. On collision, append an incrementing digit to the stem (`ashu@vbspu.com`, `ashu2@vbspu.com`, `ashu3@vbspu.com`, …). This must be **deterministic and stable across re-runs** — generate in a fixed, sorted order (e.g. by faculty id) and persist the assigned mapping in a new file (`data/imported/email-assignments.json`, id → assigned email) so re-running the script never reshuffles an existing person's address, only assigns new ones for new people.
- **Existing Supabase accounts already exist with the old `@vbspu.local` addresses** — do not delete and recreate them (that orphans the `profiles` row, which is keyed to the auth user's uid, and everything else linked to it). Instead, for every existing user, call `supabase.auth.admin.updateUserById(uid, { email: newEmail })` to change the email in place. Update `scripts/create-logins.ts` so it: (1) creates new auth users for anyone not yet created, (2) updates the email (and only the email — leave existing passwords untouched) for anyone who already exists, keyed by their current `data/imported/email-assignments.json` mapping / faculty id, not by their old email string.

## C. Self-service password change, forced on first login

Nothing in the app currently lets a logged-in person change their password — build it:

1. **Schema**: add `must_change_password boolean not null default true` to `profiles`. Set `true` for every account `create-logins.ts` creates or updates (existing 183 accounts included — this is a one-time migration to flip the flag on for everyone already created, since none of them have changed their temp password yet).
2. **Page**: `app/account/password/page.tsx` — reachable by any authenticated role (not role-gated beyond "must be logged in"). Form: new password + confirm password, client-side validation (min 8 characters, both fields match, inline errors). No "current password" field needed — `supabase.auth.updateUser({ password })` only requires an active session, which the person already has from logging in with their temp password.
3. **Server action**: `lib/actions.ts` — `changeOwnPassword(form)`, requires any authenticated user (`requireUser(["vc","registrar","hod","faculty","et","admin"])`), calls Supabase Auth's `updateUser`, then sets `must_change_password = false` on that person's `profiles` row, shows a success toast, redirects to their role's home page.
4. **Forced redirect**: in `middleware.ts` (or a layout-level check, whichever fits the existing auth flow better), if the logged-in user's `profiles.must_change_password` is `true` and they're not already on `/account/password`, redirect them there before anything else loads. This makes the forced-change unskippable on first login.
5. **Demo-cookie fallback mode**: when Supabase env vars aren't set and the app is running on the old demo-cookie auth, hide the "change password" nav link and skip the forced-redirect check entirely — that flow doesn't apply to demo accounts.
6. Add an "Account settings" link to the sidebar/nav for every role, pointing at `/account/password`.

## D. Make it ready to distribute

After A, B and C are done and verified against the live Supabase project:

- Re-run the updated `scripts/create-logins.ts` against production so every account's email is migrated to the new scheme and `must_change_password` is set.
- Regenerate `credentials-export.csv` with columns: `email, temp_password, role, name, needs_real_name_fix` (true only for the department-placeholder rows from part B) — same file, same gitignore status, just refreshed content. Do not regenerate passwords for anyone who already has one; only touch emails.
- Report back: total accounts migrated, how many collisions were resolved, how many rows are flagged `needs_real_name_fix`, and confirm the deployed app enforces the forced password-change redirect (test with one real login).
