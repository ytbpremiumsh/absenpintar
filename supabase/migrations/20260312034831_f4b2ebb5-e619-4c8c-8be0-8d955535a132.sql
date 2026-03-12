CREATE POLICY "Anon can read platform settings"
ON public.platform_settings FOR SELECT TO anon
USING (true);