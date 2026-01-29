-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix overly permissive RLS policies
-- Drop and recreate run_logs insert policy with proper check
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.run_logs;
CREATE POLICY "Users can insert logs for their runs"
    ON public.run_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.runs
            WHERE runs.id = run_logs.run_id
              AND runs.user_id = auth.uid()
        )
    );

-- Drop and recreate run_files insert policy with proper check
DROP POLICY IF EXISTS "Authenticated users can insert run files" ON public.run_files;
CREATE POLICY "Users can insert files for their runs"
    ON public.run_files FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.runs
            WHERE runs.id = run_files.run_id
              AND runs.user_id = auth.uid()
        )
    );