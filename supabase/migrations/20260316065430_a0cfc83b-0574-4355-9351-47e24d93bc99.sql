
CREATE POLICY "Users insert own login log"
  ON public.login_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
