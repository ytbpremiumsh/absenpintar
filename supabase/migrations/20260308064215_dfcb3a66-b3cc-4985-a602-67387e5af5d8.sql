-- Table to store school-level integration settings (like OneSender WA gateway)
CREATE TABLE public.school_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  integration_type text NOT NULL DEFAULT 'onesender',
  api_url text,
  api_key text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, integration_type)
);

ALTER TABLE public.school_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own integrations"
ON public.school_integrations FOR ALL
TO authenticated
USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin'::app_role)))
WITH CHECK (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin'::app_role)));

CREATE POLICY "Super admins manage all integrations"
ON public.school_integrations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER set_updated_at_school_integrations
  BEFORE UPDATE ON public.school_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();