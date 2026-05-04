
-- Tarif SPP
CREATE TABLE IF NOT EXISTS public.spp_tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  school_year text NOT NULL,
  class_name text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  due_date_day integer NOT NULL DEFAULT 10,
  denda integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, school_year, class_name)
);
ALTER TABLE public.spp_tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School users view tariffs" ON public.spp_tariffs FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Bendahara admin manage tariffs" ON public.spp_tariffs FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)));
CREATE POLICY "Super admin manage tariffs" ON public.spp_tariffs FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_spp_tariffs_updated BEFORE UPDATE ON public.spp_tariffs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tagihan SPP
CREATE TABLE IF NOT EXISTS public.spp_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  invoice_number text NOT NULL,
  student_name text NOT NULL,
  class_name text NOT NULL,
  parent_name text,
  parent_phone text,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  period_label text NOT NULL,
  description text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  denda integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,
  gateway_fee integer NOT NULL DEFAULT 0,
  net_amount integer NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mayar_invoice_id text,
  payment_url text,
  qr_code text,
  payment_method text,
  paid_at timestamptz,
  settlement_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_id, period_year, period_month)
);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_school_status ON public.spp_invoices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_mayar ON public.spp_invoices(mayar_invoice_id);
ALTER TABLE public.spp_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School view invoices" ON public.spp_invoices FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Bendahara admin manage invoices" ON public.spp_invoices FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)));
CREATE POLICY "Super admin manage invoices" ON public.spp_invoices FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_spp_invoices_updated BEFORE UPDATE ON public.spp_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Settlement
CREATE TABLE IF NOT EXISTS public.spp_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  settlement_code text NOT NULL,
  total_transactions integer NOT NULL DEFAULT 0,
  total_gross integer NOT NULL DEFAULT 0,
  total_gateway_fee integer NOT NULL DEFAULT 0,
  total_net integer NOT NULL DEFAULT 0,
  withdraw_fee integer NOT NULL DEFAULT 3000,
  final_payout integer NOT NULL DEFAULT 0,
  bank_name text,
  account_number text,
  account_holder text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  admin_notes text,
  requested_by uuid,
  reviewed_by uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spp_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School view settlements" ON public.spp_settlements FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Bendahara create settlements" ON public.spp_settlements FOR INSERT TO authenticated WITH CHECK (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)));
CREATE POLICY "Super admin manage settlements" ON public.spp_settlements FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_spp_settlements_updated BEFORE UPDATE ON public.spp_settlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logs
CREATE TABLE IF NOT EXISTS public.spp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid,
  invoice_id uuid,
  event_type text NOT NULL,
  status text,
  payload jsonb,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School view logs" ON public.spp_logs FOR SELECT TO authenticated USING (school_id IS NULL OR school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Super admin manage logs" ON public.spp_logs FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));

-- Bendahara settings
CREATE TABLE IF NOT EXISTS public.bendahara_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE,
  environment text NOT NULL DEFAULT 'sandbox',
  use_platform_key boolean NOT NULL DEFAULT true,
  api_key text,
  secret_key text,
  webhook_url text,
  last_test_status text,
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bendahara_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School view settings" ON public.bendahara_settings FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Bendahara admin manage settings" ON public.bendahara_settings FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(),'bendahara'::app_role) OR has_role(auth.uid(),'school_admin'::app_role)));
CREATE POLICY "Super admin manage all settings" ON public.bendahara_settings FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_bendahara_settings_updated BEFORE UPDATE ON public.bendahara_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
