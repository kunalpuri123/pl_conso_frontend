-- Create dedicated PDP Input Creation storage buckets
-- with the same permission model as PL Input Creation storage.

-- 1) Create private buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('pdp-input-creation-output', 'pdp-input-creation-output', false),
  ('pdp-input-creation-master', 'pdp-input-creation-master', false),
  ('pdp-input-creation-crawl-team-file', 'pdp-input-creation-crawl-team-file', false),
  ('pdp-input-creation-bussiness-file', 'pdp-input-creation-bussiness-file', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Defensive: keep dedicated PDP input-creation buckets private
UPDATE storage.buckets
SET public = false
WHERE name IN (
  'pdp-input-creation-output',
  'pdp-input-creation-master',
  'pdp-input-creation-crawl-team-file',
  'pdp-input-creation-bussiness-file'
);

-- 2) Expand authenticated read policy to include new PDP input-creation buckets
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
    'pdp-input-creation-output',
    'pdp-input-creation-master',
    'pdp-input-creation-crawl-team-file',
    'pdp-input-creation-bussiness-file',
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

-- 3) Expand authenticated insert policy using same PL-input style permissions:
--    allowed for "business" and "crawl-team" upload buckets
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
    'pdp-input-creation-bussiness-file',
    'pdp-input-creation-crawl-team-file',
    'input-files',
    'crawl-input',
    'pdp-input',
    'pp-input',
    'pp-review-input',
    'pp-cache'
  )
);
