ALTER TABLE public.bendahara_settings
  ADD COLUMN IF NOT EXISTS confirmer_user_id uuid;

CREATE TABLE IF NOT EXISTS public.bendahara_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  phone text NOT NULL,
  otp_code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bendahara_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only bendahara_otps"
  ON public.bendahara_otps FOR ALL TO service_role
  USING (true) WITH CHECK (true);