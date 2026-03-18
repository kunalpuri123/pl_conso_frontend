-- Allow PDP Input runs to be persisted with a dedicated automation slug
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.runs'::regclass
      AND conname = 'runs_automation_slug_check'
  ) THEN
    ALTER TABLE public.runs DROP CONSTRAINT runs_automation_slug_check;
  END IF;
END $$;

ALTER TABLE public.runs
  ADD CONSTRAINT runs_automation_slug_check
  CHECK (
    automation_slug IS NULL
    OR automation_slug IN ('pl-conso', 'pl-input', 'pdp-input', 'pdp-conso', 'pp-conso')
  );
