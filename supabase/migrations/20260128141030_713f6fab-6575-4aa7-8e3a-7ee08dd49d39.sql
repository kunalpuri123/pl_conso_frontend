-- Create storage bucket for input files
INSERT INTO storage.buckets (id, name, public)
VALUES ('input-files', 'input-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for run outputs  
INSERT INTO storage.buckets (id, name, public)
VALUES ('run-outputs', 'run-outputs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for input-files bucket
CREATE POLICY "Authenticated users can view input files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'input-files');

CREATE POLICY "Admins can upload input files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'input-files' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete input files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'input-files' 
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS policies for run-outputs bucket
CREATE POLICY "Authenticated users can view run outputs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'run-outputs');

CREATE POLICY "Authenticated users can upload run outputs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'run-outputs');

CREATE POLICY "Authenticated users can download run outputs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'run-outputs');