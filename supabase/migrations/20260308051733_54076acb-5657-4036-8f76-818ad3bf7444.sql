
-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view school classes" ON public.classes
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Users manage school classes" ON public.classes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()))
  WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

-- Create pickup_settings table
CREATE TABLE public.pickup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view school pickup settings" ON public.pickup_settings
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Users manage school pickup settings" ON public.pickup_settings
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()))
  WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

-- Seed classes from existing student data
INSERT INTO public.classes (school_id, name)
SELECT DISTINCT school_id, class FROM public.students
ON CONFLICT (school_id, name) DO NOTHING;
