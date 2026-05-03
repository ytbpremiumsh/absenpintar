ALTER TABLE public.parent_leave_requests
  ADD COLUMN IF NOT EXISTS attachment_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('parent-attachments', 'parent-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read parent attachments" ON storage.objects;
CREATE POLICY "Public read parent attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'parent-attachments');

DROP POLICY IF EXISTS "Anyone upload parent attachments" ON storage.objects;
CREATE POLICY "Anyone upload parent attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'parent-attachments');