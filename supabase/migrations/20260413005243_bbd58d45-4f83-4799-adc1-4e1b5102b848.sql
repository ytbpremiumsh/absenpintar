
CREATE TABLE public.wa_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  total_purchased integer NOT NULL DEFAULT 0,
  total_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

ALTER TABLE public.wa_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School users view own credits"
ON public.wa_credits FOR SELECT
TO authenticated
USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Super admins manage all credits"
ON public.wa_credits FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_wa_credits_updated_at
BEFORE UPDATE ON public.wa_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
