-- Forces a password change on first login for every account create-logins.ts
-- manages. Defaults true so newly-created accounts need it; existing rows are
-- explicitly flipped true below as a one-time migration, since none of the
-- 183 accounts created so far have changed their temp password yet.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true;
UPDATE profiles SET must_change_password = true;
