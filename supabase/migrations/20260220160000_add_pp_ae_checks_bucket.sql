-- Add dedicated bucket for AE PP template files (AE_CHECK_FOLDER replacement)

-- 1) Create bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pp-ae-checks', 'pp-ae-checks', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Defensive: keep bucket private
UPDATE storage.buckets
SET public = false
WHERE name IN ('pp-ae-checks');

-- 2) Expand authenticated read policy to include pp-ae-checks
DROP POLICY IF EXISTS "storage_read_authenticated_app_buckets" ON storage.objects;
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
    'pdp-run-output',
    'pp-input',
    'pp-review-input',
    'pp-reference',
    'pp-run-output',
    'pp-ae-checks'
  )
);

-- 3) Keep existing broad authenticated insert policy as-is by recreating current allowlist
DROP POLICY IF EXISTS "storage_insert_authenticated_limited" ON storage.objects;
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
    'pdp-input',
    'pp-input',
    'pp-review-input'
  )
);

-- 4) Admin-only upload/update/delete on pp-ae-checks
DROP POLICY IF EXISTS "storage_insert_admin_pp_ae_checks" ON storage.objects;
CREATE POLICY "storage_insert_admin_pp_ae_checks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pp-ae-checks'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "storage_update_admin_pp_ae_checks" ON storage.objects;
CREATE POLICY "storage_update_admin_pp_ae_checks"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pp-ae-checks'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'pp-ae-checks'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "storage_delete_admin_pp_ae_checks" ON storage.objects;
CREATE POLICY "storage_delete_admin_pp_ae_checks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pp-ae-checks'
  AND public.has_role(auth.uid(), 'admin')
);
