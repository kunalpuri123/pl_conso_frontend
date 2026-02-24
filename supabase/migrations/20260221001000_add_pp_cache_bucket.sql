-- Add PP cache bucket for cached/recalculated AE templates

INSERT INTO storage.buckets (id, name, public)
VALUES ('pp-cache', 'pp-cache', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

UPDATE storage.buckets
SET public = false
WHERE name IN ('pp-cache');

-- Recreate read policy with pp-cache included
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
    'pp-ae-checks',
    'pp-cache'
  )
);

-- Recreate insert policy with pp-cache included (service-role/admin writes are expected)
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
    'pp-review-input',
    'pp-cache'
  )
);
