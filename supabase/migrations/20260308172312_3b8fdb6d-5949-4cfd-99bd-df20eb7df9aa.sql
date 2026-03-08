
-- Create class_teachers table to link teachers to classes
CREATE TABLE public.class_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_name, school_id)
);

-- Enable RLS
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- School admins can manage class teachers in their school
CREATE POLICY "School admins manage class teachers"
  ON public.class_teachers
  FOR ALL
  USING (
    (school_id = get_user_school_id(auth.uid()))
    AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    (school_id = get_user_school_id(auth.uid()))
    AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
  );

-- Teachers can view their own assignments
CREATE POLICY "Teachers view own assignments"
  ON public.class_teachers
  FOR SELECT
  USING (user_id = auth.uid());

-- Super admins manage all
CREATE POLICY "Super admins manage all class teachers"
  ON public.class_teachers
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
