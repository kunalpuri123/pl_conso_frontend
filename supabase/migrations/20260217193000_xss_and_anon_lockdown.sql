-- XSS and anon-access lockdown
-- 1) Revoke anon table privileges for residual readable tables
-- 2) Sanitize selected user-controlled text fields on write

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feedback FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.run_logs FROM anon;
REVOKE ALL ON TABLE public.feedback FROM anon;

CREATE OR REPLACE FUNCTION public.sanitize_plain_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN input_text IS NULL THEN NULL
    ELSE replace(replace(input_text, '<', '&lt;'), '>', '&gt;')
  END
$$;

CREATE OR REPLACE FUNCTION public.sanitize_profiles_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.full_name := public.sanitize_plain_text(NEW.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_profiles_before_write ON public.profiles;
CREATE TRIGGER trg_sanitize_profiles_before_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_profiles_before_write();

CREATE OR REPLACE FUNCTION public.sanitize_feedback_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.subject := public.sanitize_plain_text(NEW.subject);
  NEW.message := public.sanitize_plain_text(NEW.message);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_feedback_before_write ON public.feedback;
CREATE TRIGGER trg_sanitize_feedback_before_write
BEFORE INSERT OR UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_feedback_before_write();

