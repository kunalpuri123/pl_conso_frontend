-- Enforce runs metadata validation for automation slugs
-- Includes AE PP automation slug: pp-conso

-- Ensure expected metadata columns exist (safe for environments missing these columns)
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS automation_slug TEXT,
  ADD COLUMN IF NOT EXISTS op_filename TEXT,
  ADD COLUMN IF NOT EXISTS ip_filename TEXT;

-- Drop legacy constraint if present so we can define the canonical allowlist
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

-- Allow only known automation slugs (or NULL for legacy/older runs)
ALTER TABLE public.runs
  ADD CONSTRAINT runs_automation_slug_check
  CHECK (
    automation_slug IS NULL
    OR automation_slug IN ('pl-conso', 'pl-input', 'pdp-conso', 'pp-conso')
  );

-- Helpful index for common filtering/history queries
CREATE INDEX IF NOT EXISTS idx_runs_automation_slug_created_at
  ON public.runs (automation_slug, created_at DESC);
