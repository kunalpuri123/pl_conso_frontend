-- AuthZ hotfix
-- 1) Prevent recursive role checks by making has_role non-inlineable and RLS-safe
-- 2) Remove stale policies and re-apply strict policies for sensitive tables
-- 3) Explicitly revoke anon privileges on sensitive tables

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_files ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.run_files FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  _is_match boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  ) INTO _is_match;

  RETURN COALESCE(_is_match, false);
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['user_roles', 'projects', 'runs', 'run_files'])
  LOOP
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- user_roles
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

-- projects
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

-- runs
CREATE POLICY "runs_select_owner_or_admin"
ON public.runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "runs_insert_own_or_admin"
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

-- run_files
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

CREATE POLICY "run_files_delete_admin_only"
ON public.run_files
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON TABLE public.user_roles FROM anon;
REVOKE ALL ON TABLE public.projects FROM anon;
REVOKE ALL ON TABLE public.runs FROM anon;
REVOKE ALL ON TABLE public.run_files FROM anon;

