
-- Public storage bucket for document images (struk, invoice, resi)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder (path: <uid>/...)
CREATE POLICY "Users upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read (public bucket — for WA link sharing)
CREATE POLICY "Public read documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');

-- Users can delete own files
CREATE POLICY "Users delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
