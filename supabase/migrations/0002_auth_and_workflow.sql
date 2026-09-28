-- Auth, multi-department faculty membership, and the edit/approval workflow.
-- Run this once in the Supabase SQL Editor against a project that already has
-- supabase/schema.sql applied (departments, programs, faculty, ... tables).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------- profiles
-- One row per Supabase Auth user. role/dept_id/faculty_id drive the same
-- navigation and scoping that data/types.ts#UserAccount drove under the demo
-- cookie system.
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('vc', 'registrar', 'hod', 'faculty', 'et', 'admin')),
  dept_id       text REFERENCES departments(id),
  faculty_id    text REFERENCES faculty(id),
  display_name  text NOT NULL,
  -- Mirrors data/types.ts#UserStatus. VC/Registrar/ET/Admin are always 'active'.
  status        text NOT NULL DEFAULT 'active'
    CHECK (status IN ('onboarding_incomplete', 'pending_approval', 'active')),
  rejection_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------- faculty_departments
-- A faculty member can serve several departments (data/types.ts: departments:
-- string[]). faculty.dept_id (below) stays the PRIMARY department; this table
-- is the full membership list, including that primary row.
CREATE TABLE IF NOT EXISTS faculty_departments (
  faculty_id  text NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  dept_id     text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, dept_id)
);
CREATE INDEX IF NOT EXISTS faculty_departments_dept_id_idx ON faculty_departments(dept_id);

-- --------------------------------------------------------------- change_requests
-- Mirrors data/types.ts#ChangeRequest field-for-field (snake_case). The single-
-- admin-approver workflow in lib/actions.ts (adminApprove/adminReject) is
-- unchanged — this table just makes it durable.
CREATE TABLE IF NOT EXISTS change_requests (
  id                     text PRIMARY KEY,
  type                   text NOT NULL CHECK (type IN ('edit', 'onboarding')),
  target_entity          text NOT NULL CHECK (target_entity IN ('Faculty', 'HoD', 'Infrastructure')),
  target_id              text,
  submitted_by_user_id   uuid NOT NULL REFERENCES auth.users(id),
  submitted_by_role      text NOT NULL CHECK (submitted_by_role IN ('vc', 'registrar', 'hod', 'faculty', 'et', 'admin')),
  dept_id                text NOT NULL REFERENCES departments(id),
  section                text CHECK (section IN ('profile', 'research', 'projects', 'target')),
  payload                jsonb NOT NULL,
  status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at           timestamptz NOT NULL DEFAULT now(),
  reviewed_by_user_id    uuid REFERENCES auth.users(id),
  reviewed_at            timestamptz,
  review_notes           text
);
CREATE INDEX IF NOT EXISTS change_requests_status_idx ON change_requests(status);
CREATE INDEX IF NOT EXISTS change_requests_submitted_by_idx ON change_requests(submitted_by_user_id);

-- ---------------------------------------------------------------- helper fns
-- SECURITY DEFINER + STABLE: reads the caller's own role/dept/faculty without
-- re-triggering RLS on profiles (which would recurse), so policies below can
-- call these directly.
CREATE OR REPLACE FUNCTION auth_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_dept_id() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT dept_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_faculty_id() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT faculty_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_privileged_reader() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth_role() IN ('hod', 'registrar', 'vc', 'admin', 'et')
$$;

-- ------------------------------------------------------------------------- RLS

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty              ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_departments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_research     ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_targets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_target_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hod_submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests      ENABLE ROW LEVEL SECURITY;

-- profiles: everyone reads their own row; privileged roles read all; only the
-- service role (server actions) writes.
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() OR is_privileged_reader());

-- Read-mostly reference/report tables: any authenticated user reads; all
-- writes happen server-side with the service-role key (bypasses RLS), never
-- from the browser.
DROP POLICY IF EXISTS departments_read ON departments;
CREATE POLICY departments_read ON departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS programs_read ON programs;
CREATE POLICY programs_read ON programs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS infrastructure_read ON infrastructure;
CREATE POLICY infrastructure_read ON infrastructure FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS hod_submissions_read ON hod_submissions;
CREATE POLICY hod_submissions_read ON hod_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS target_summaries_read ON faculty_target_summaries;
CREATE POLICY target_summaries_read ON faculty_target_summaries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS faculty_departments_read ON faculty_departments;
CREATE POLICY faculty_departments_read ON faculty_departments FOR SELECT TO authenticated USING (true);

-- faculty: a faculty user reads/updates only their own row; hod/registrar/vc/
-- admin/et read all; direct writes are admin-only (service role). Everyone
-- else proposes changes through change_requests instead.
DROP POLICY IF EXISTS faculty_select ON faculty;
CREATE POLICY faculty_select ON faculty FOR SELECT TO authenticated
  USING (id = auth_faculty_id() OR is_privileged_reader());

DROP POLICY IF EXISTS faculty_update_self ON faculty;
CREATE POLICY faculty_update_self ON faculty FOR UPDATE TO authenticated
  USING (id = auth_faculty_id())
  WITH CHECK (id = auth_faculty_id());

DROP POLICY IF EXISTS faculty_research_select ON faculty_research;
CREATE POLICY faculty_research_select ON faculty_research FOR SELECT TO authenticated
  USING (faculty_id = auth_faculty_id() OR is_privileged_reader());

DROP POLICY IF EXISTS faculty_research_update_self ON faculty_research;
CREATE POLICY faculty_research_update_self ON faculty_research FOR UPDATE TO authenticated
  USING (faculty_id = auth_faculty_id())
  WITH CHECK (faculty_id = auth_faculty_id());

DROP POLICY IF EXISTS faculty_projects_select ON faculty_projects;
CREATE POLICY faculty_projects_select ON faculty_projects FOR SELECT TO authenticated
  USING (faculty_id = auth_faculty_id() OR is_privileged_reader());

DROP POLICY IF EXISTS faculty_targets_select ON faculty_targets;
CREATE POLICY faculty_targets_select ON faculty_targets FOR SELECT TO authenticated
  USING (faculty_id = auth_faculty_id() OR is_privileged_reader());

-- change_requests: any authenticated user inserts their own; the submitter
-- reads their own, privileged roles read all; only admin updates (approve/
-- reject) — enforced with the service role in lib/actions.ts, and mirrored
-- here so a client-side call could never bypass it.
DROP POLICY IF EXISTS change_requests_insert_own ON change_requests;
CREATE POLICY change_requests_insert_own ON change_requests FOR INSERT TO authenticated
  WITH CHECK (submitted_by_user_id = auth.uid());

DROP POLICY IF EXISTS change_requests_select ON change_requests;
CREATE POLICY change_requests_select ON change_requests FOR SELECT TO authenticated
  USING (submitted_by_user_id = auth.uid() OR is_privileged_reader());

DROP POLICY IF EXISTS change_requests_update_admin ON change_requests;
CREATE POLICY change_requests_update_admin ON change_requests FOR UPDATE TO authenticated
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');
