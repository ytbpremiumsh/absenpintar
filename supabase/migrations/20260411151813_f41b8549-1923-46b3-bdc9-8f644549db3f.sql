
-- Table for tracking purchased add-ons per school
CREATE TABLE public.school_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL DEFAULT 'custom_domain',
  custom_domain TEXT,
  domain_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'active',
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  amount INTEGER NOT NULL DEFAULT 200000,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, addon_type)
);

ALTER TABLE public.school_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School users view own addons"
  ON public.school_addons FOR SELECT
  TO authenticated
  USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Super admins manage all addons"
  ON public.school_addons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_school_addons_updated_at
  BEFORE UPDATE ON public.school_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
