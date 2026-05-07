
-- Add photo_url and qr_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_code text;

-- Backfill qr_code with user_id for existing profiles
UPDATE public.profiles SET qr_code = user_id::text WHERE qr_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_qr_code ON public.profiles(qr_code);

-- Teacher attendance logs
CREATE TABLE IF NOT EXISTS public.teacher_attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL DEFAULT CURRENT_TIME,
  status text NOT NULL DEFAULT 'hadir',
  method text NOT NULL DEFAULT 'barcode',
  attendance_type text NOT NULL DEFAULT 'datang',
  notes text,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tal_school_date ON public.teacher_attendance_logs(school_id, date);
CREATE INDEX IF NOT EXISTS idx_tal_user_date ON public.teacher_attendance_logs(user_id, date);

ALTER TABLE public.teacher_attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School users view teacher attendance"
ON public.teacher_attendance_logs FOR SELECT TO authenticated
USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "School staff insert teacher attendance"
ON public.teacher_attendance_logs FOR INSERT TO authenticated
WITH CHECK (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "School staff update teacher attendance"
ON public.teacher_attendance_logs FOR UPDATE TO authenticated
USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "School staff delete teacher attendance"
ON public.teacher_attendance_logs FOR DELETE TO authenticated
USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Super admins manage teacher attendance"
ON public.teacher_attendance_logs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users view own teacher attendance"
ON public.teacher_attendance_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-photos', 'teacher-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read teacher photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Auth upload teacher photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teacher-photos');

CREATE POLICY "Auth update teacher photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Auth delete teacher photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'teacher-photos');
