
-- Subscription plans table (managed by super_admin)
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_students integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- School subscriptions
CREATE TABLE public.school_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment transactions
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  mayar_transaction_id text,
  mayar_payment_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- subscription_plans: everyone can read active plans, super_admin can manage all
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins manage plans" ON public.subscription_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- school_subscriptions: school users can view own, super_admin can manage all
CREATE POLICY "School users view own subscriptions" ON public.school_subscriptions FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Super admins manage all subscriptions" ON public.school_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- payment_transactions: school users view own, super_admin manages all
CREATE POLICY "School users view own payments" ON public.payment_transactions FOR SELECT TO authenticated USING (school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Super admins manage all payments" ON public.payment_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School users create payments" ON public.payment_transactions FOR INSERT TO authenticated WITH CHECK (school_id = get_user_school_id(auth.uid()));

-- Allow anon to read plans for subscription page
CREATE POLICY "Anon can view active plans" ON public.subscription_plans FOR SELECT TO anon USING (is_active = true);

-- Trigger for updated_at on subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default plans
INSERT INTO public.subscription_plans (name, price, description, features, max_students, sort_order) VALUES
('Basic', 99000, 'Untuk sekolah kecil yang baru memulai', '["Monitoring penjemputan realtime", "Scan QR Code", "Manajemen siswa", "Riwayat penjemputan", "Maksimal 200 siswa"]', 200, 1),
('School', 199000, 'Cocok untuk sekolah dengan banyak siswa', '["Semua fitur Basic", "Unlimited siswa", "Multi petugas scan", "Export laporan Excel", "Upload foto siswa"]', null, 2),
('Premium', 399000, 'Untuk sekolah besar & multi cabang', '["Semua fitur School", "WhatsApp notifikasi otomatis", "Multi cabang sekolah", "Custom logo sekolah", "Priority support", "API Integration"]', null, 3);
