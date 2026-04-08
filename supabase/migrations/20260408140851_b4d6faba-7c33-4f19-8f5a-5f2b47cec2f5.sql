
ALTER TABLE public.school_integrations 
ADD COLUMN IF NOT EXISTS gateway_type text NOT NULL DEFAULT 'onesender',
ADD COLUMN IF NOT EXISTS mpwa_api_key text,
ADD COLUMN IF NOT EXISTS mpwa_sender text,
ADD COLUMN IF NOT EXISTS mpwa_connected boolean NOT NULL DEFAULT false;
