-- Tabel untuk konten panduan yang bisa diedit super admin
CREATE TABLE IF NOT EXISTS public.panduan_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  cover TEXT,
  mobile_mockup TEXT,
  color TEXT NOT NULL DEFAULT 'from-indigo-500 to-blue-600',
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.panduan_content ENABLE ROW LEVEL SECURITY;

-- Publik bisa baca (panduan halaman umum)
CREATE POLICY "Panduan content public read"
  ON public.panduan_content FOR SELECT
  USING (true);

-- Hanya super_admin bisa modifikasi
CREATE POLICY "Super admin manage panduan"
  ON public.panduan_content FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_panduan_content_updated_at
  BEFORE UPDATE ON public.panduan_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket khusus aset panduan (publik baca)
INSERT INTO storage.buckets (id, name, public)
VALUES ('panduan-assets', 'panduan-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Panduan assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'panduan-assets');

CREATE POLICY "Super admin upload panduan assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'panduan-assets' AND public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin update panduan assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'panduan-assets' AND public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin delete panduan assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'panduan-assets' AND public.has_role(auth.uid(), 'super_admin'::app_role));