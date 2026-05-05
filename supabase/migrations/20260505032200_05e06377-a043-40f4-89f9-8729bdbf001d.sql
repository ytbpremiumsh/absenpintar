-- Email settings (SMTP) for Super Admin global config
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'ATSkolla',
  is_active BOOLEAN NOT NULL DEFAULT false,
  -- Toggle per event
  send_on_register BOOLEAN NOT NULL DEFAULT true,
  send_on_spp_paid BOOLEAN NOT NULL DEFAULT true,
  -- Templates (HTML, support placeholders {name}, {school}, {email}, {invoice}, {amount}, {period})
  template_register_subject TEXT NOT NULL DEFAULT 'Selamat datang di ATSkolla',
  template_register_html TEXT NOT NULL DEFAULT '<h2>Halo {name}</h2><p>Akun ATSkolla untuk <b>{school}</b> berhasil dibuat. Silakan login menggunakan email <b>{email}</b>.</p>',
  template_spp_subject TEXT NOT NULL DEFAULT 'Pembayaran SPP Berhasil — {invoice}',
  template_spp_html TEXT NOT NULL DEFAULT '<h2>Terima kasih, {name}</h2><p>Pembayaran SPP <b>{period}</b> sebesar <b>{amount}</b> telah kami terima. No. Invoice: <b>{invoice}</b>.</p>',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage email_settings"
ON public.email_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_email_settings_updated
BEFORE UPDATE ON public.email_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email send log for audit
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'register' | 'spp_paid' | 'broadcast' | 'test'
  status TEXT NOT NULL,     -- 'sent' | 'failed'
  error TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view email_logs"
ON public.email_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service can insert email_logs"
ON public.email_logs FOR INSERT
TO authenticated
WITH CHECK (true);
