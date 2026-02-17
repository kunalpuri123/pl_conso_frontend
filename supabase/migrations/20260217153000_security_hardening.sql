-- Security hardening migration
-- Goals:
-- 1) Remove permissive/ambiguous RLS policies
-- 2) Ensure anonymous users cannot read/write sensitive tables
-- 3) Ensure storage buckets are private and anonymous access is blocked
-- 4) Require authenticated context for app data operations

-- -----------------------------
-- Table RLS hardening
-- -----------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.input_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop legacy/overly permissive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;

DROP POLICY IF EXISTS "Authenticated users can view sites" ON public.sites;
DROP POLICY IF EXISTS "Admins can manage sites" ON public.sites;

DROP POLICY IF EXISTS "Users can view their own runs" ON public.runs;
DROP POLICY IF EXISTS "Users can view team runs" ON public.runs;
DROP POLICY IF EXISTS "Users can create runs" ON public.runs;
DROP POLICY IF EXISTS "Users can update their own runs" ON public.runs;

DROP POLICY IF EXISTS "Users can view logs for their runs" ON public.run_logs;
DROP POLICY IF EXISTS "Users can insert logs for their runs" ON public.run_logs;

DROP POLICY IF EXISTS "Users can view files for accessible runs" ON public.run_files;
DROP POLICY IF EXISTS "Users can insert files for their runs" ON public.run_files;

DROP POLICY IF EXISTS "Authenticated users can view input files" ON public.input_files;
DROP POLICY IF EXISTS "Admins can manage input files" ON public.input_files;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;

-- Profiles
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_insert_admin_only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_update_admin_only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_delete_admin_only"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Projects and sites
CREATE POLICY "projects_select_authenticated"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "projects_manage_admin_only"
ON public.projects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sites_select_authenticated"
ON public.sites
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "sites_manage_admin_only"
ON public.sites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Runs
CREATE POLICY "runs_select_owner_or_admin"
ON public.runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "runs_insert_own"
ON public.runs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "runs_update_owner_or_admin"
ON public.runs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "runs_delete_admin_only"
ON public.runs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Run logs
CREATE POLICY "run_logs_select_owner_or_admin"
ON public.run_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.runs r
    WHERE r.id = run_logs.run_id
      AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "run_logs_insert_admin_only"
ON public.run_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Run files
CREATE POLICY "run_files_select_owner_or_admin"
ON public.run_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.runs r
    WHERE r.id = run_files.run_id
      AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "run_files_insert_admin_only"
ON public.run_files
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Input files
CREATE POLICY "input_files_select_authenticated"
ON public.input_files
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "input_files_manage_admin_only"
ON public.input_files
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log
CREATE POLICY "audit_log_select_admin_only"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "audit_log_insert_authenticated"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Feedback
CREATE POLICY "feedback_select_own_or_admin"
ON public.feedback
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "feedback_insert_own"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_update_admin_only"
ON public.feedback
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "feedback_delete_admin_only"
ON public.feedback
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------
-- Storage hardening
-- -----------------------------

-- Ensure key buckets are not public
UPDATE storage.buckets
SET public = false
WHERE name IN (
  'input-creation-output',
  'input-creation-master',
  'input-creation-crawl-team-file',
  'input-creation-bussiness-file',
  'attachment-feedback',
  'crawl-input',
  'masters',
  'input-files',
  'run-outputs',
  'pdp-input',
  'pdp-crawl-input',
  'pdp-masters',
  'pdp-run-output'
);

-- Remove existing object policies to avoid policy overlap
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Generic read policy for authenticated users in app buckets (blocks anon)
CREATE POLICY "storage_read_authenticated_app_buckets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN (
    'input-creation-output',
    'input-creation-master',
    'input-creation-crawl-team-file',
    'input-creation-bussiness-file',
    'attachment-feedback',
    'crawl-input',
    'masters',
    'input-files',
    'run-outputs',
    'pdp-input',
    'pdp-crawl-input',
    'pdp-masters',
    'pdp-run-output'
  )
);

-- Authenticated users can upload only to designated buckets they use
CREATE POLICY "storage_insert_authenticated_limited"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN (
    'attachment-feedback',
    'input-creation-bussiness-file',
    'input-creation-crawl-team-file',
    'input-files',
    'crawl-input',
    'pdp-input'
  )
);

-- Deletes limited to object owner or admins
CREATE POLICY "storage_delete_owner_or_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  owner = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Updates limited to owner or admins
CREATE POLICY "storage_update_owner_or_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  owner = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  owner = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);
