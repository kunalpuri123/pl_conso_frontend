-- Add AE PP storage buckets and align storage policies with hardened PL/PDP model

-- 1) Create PP buckets (private)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('pp-input', 'pp-input', false),
  ('pp-review-input', 'pp-review-input', false),
  ('pp-reference', 'pp-reference', false),
  ('pp-run-output', 'pp-run-output', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Defensive: ensure PP buckets are private
UPDATE storage.buckets
SET public = false
WHERE name IN ('pp-input', 'pp-review-input', 'pp-reference', 'pp-run-output');

-- 2) Expand authenticated read policy to include PP buckets
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
    'pp-run-output'
  )
);

-- 3) Expand authenticated upload policy to PP buckets used by UI uploads
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
