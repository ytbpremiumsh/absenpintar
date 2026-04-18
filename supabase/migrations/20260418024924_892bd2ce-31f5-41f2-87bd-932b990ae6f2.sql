CREATE TABLE public.school_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_school_announcements_school ON public.school_announcements(school_id, created_at DESC);

ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view school announcements"
ON public.school_announcements FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "School admins manage announcements"
ON public.school_announcements FOR ALL TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'::app_role))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Super admins manage all announcements"
ON public.school_announcements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_school_announcements_updated_at
BEFORE UPDATE ON public.school_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();