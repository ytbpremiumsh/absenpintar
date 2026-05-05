CREATE TABLE IF NOT EXISTS public.bendahara_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bendahara_bank_accounts_school ON public.bendahara_bank_accounts(school_id);

ALTER TABLE public.bendahara_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School staff can view own school bank accounts"
  ON public.bendahara_bank_accounts FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "School staff can insert own school bank accounts"
  ON public.bendahara_bank_accounts FOR INSERT
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'bendahara')
      OR public.has_role(auth.uid(), 'school_admin')
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

CREATE POLICY "School staff can update own school bank accounts"
  ON public.bendahara_bank_accounts FOR UPDATE
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "School staff can delete own school bank accounts"
  ON public.bendahara_bank_accounts FOR DELETE
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_bendahara_bank_accounts_updated_at
  BEFORE UPDATE ON public.bendahara_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();