-- Persist optional go-live date for input creation runs (used by PDP input batch date)
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS go_live_date date;
