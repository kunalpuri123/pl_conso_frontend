-- Add AE template filename tracking for PP runs
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS ae_filename TEXT;

CREATE INDEX IF NOT EXISTS idx_runs_ae_filename
  ON public.runs (ae_filename);
