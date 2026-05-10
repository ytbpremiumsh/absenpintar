
-- Shortlink feature
CREATE TABLE public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  target_url text NOT NULL,
  title text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  click_count bigint NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_short_links_code ON public.short_links(code);

CREATE TABLE public.short_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referer text,
  ip text,
  country text
);

CREATE INDEX idx_short_link_clicks_link ON public.short_link_clicks(link_id, clicked_at DESC);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;

-- Public can read active shortlinks (needed for redirect)
CREATE POLICY "Public can read active shortlinks"
ON public.short_links FOR SELECT
USING (is_active = true);

-- Super admin full access
CREATE POLICY "Super admin manage shortlinks"
ON public.short_links FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Anyone (incl anon) can insert click records (for tracking)
CREATE POLICY "Public insert click"
ON public.short_link_clicks FOR INSERT
WITH CHECK (true);

-- Super admin can read clicks
CREATE POLICY "Super admin read clicks"
ON public.short_link_clicks FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin delete clicks"
ON public.short_link_clicks FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger updated_at
CREATE TRIGGER update_short_links_updated_at
BEFORE UPDATE ON public.short_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to increment click counter (allows anon to bump)
CREATE OR REPLACE FUNCTION public.increment_shortlink_click(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link_id uuid;
BEGIN
  SELECT id INTO _link_id FROM public.short_links WHERE code = _code AND is_active = true;
  IF _link_id IS NULL THEN RETURN; END IF;
  UPDATE public.short_links SET click_count = click_count + 1 WHERE id = _link_id;
  INSERT INTO public.short_link_clicks (link_id) VALUES (_link_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_shortlink_click(text) TO anon, authenticated;
