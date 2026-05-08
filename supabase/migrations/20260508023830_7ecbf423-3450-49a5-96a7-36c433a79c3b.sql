
-- Rename pickup → dismissal terminology
ALTER TABLE public.pickup_logs RENAME COLUMN pickup_time TO dismissal_time;
ALTER TABLE public.pickup_logs RENAME COLUMN pickup_by TO dismissed_by;
ALTER TABLE public.pickup_logs RENAME TO dismissal_logs;
ALTER TABLE public.pickup_settings RENAME TO dismissal_settings;

-- Recreate policies with cleaner names
DROP POLICY IF EXISTS "Staff create pickup logs" ON public.dismissal_logs;
DROP POLICY IF EXISTS "Staff delete pickup logs" ON public.dismissal_logs;
DROP POLICY IF EXISTS "Staff update pickup logs" ON public.dismissal_logs;
DROP POLICY IF EXISTS "Users view school pickup logs" ON public.dismissal_logs;
DROP POLICY IF EXISTS "Users manage school pickup settings" ON public.dismissal_settings;
DROP POLICY IF EXISTS "Users view school pickup settings" ON public.dismissal_settings;

CREATE POLICY "Users view school dismissal logs" ON public.dismissal_logs
  FOR SELECT USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Staff create dismissal logs" ON public.dismissal_logs
  FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Staff update dismissal logs" ON public.dismissal_logs
  FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Staff delete dismissal logs" ON public.dismissal_logs
  FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Users view school dismissal settings" ON public.dismissal_settings
  FOR SELECT USING (true);
CREATE POLICY "Users manage school dismissal settings" ON public.dismissal_settings
  FOR ALL USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
