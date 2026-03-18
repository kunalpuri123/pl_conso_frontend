-- Create AI report table if missing and enforce access policies.
CREATE TABLE IF NOT EXISTS public.run_ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  report_json jsonb NULL,
  summary text NULL,
  accuracy numeric NULL,
  verdict text NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_run_ai_reports_run_id_created_at
  ON public.run_ai_reports (run_id, created_at DESC);

ALTER TABLE public.run_ai_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "run_ai_reports_select_owner_or_admin" ON public.run_ai_reports;
DROP POLICY IF EXISTS "run_ai_reports_insert_admin_only" ON public.run_ai_reports;
DROP POLICY IF EXISTS "run_ai_reports_update_admin_only" ON public.run_ai_reports;
DROP POLICY IF EXISTS "run_ai_reports_delete_admin_only" ON public.run_ai_reports;

CREATE POLICY "run_ai_reports_select_owner_or_admin"
ON public.run_ai_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.runs r
    WHERE r.id = run_ai_reports.run_id
      AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "run_ai_reports_insert_admin_only"
ON public.run_ai_reports
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "run_ai_reports_update_admin_only"
ON public.run_ai_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "run_ai_reports_delete_admin_only"
ON public.run_ai_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
