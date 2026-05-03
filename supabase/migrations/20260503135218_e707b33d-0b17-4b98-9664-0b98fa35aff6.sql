ALTER TABLE public.school_announcements 
ADD COLUMN IF NOT EXISTS target_audience text NOT NULL DEFAULT 'staff';

COMMENT ON COLUMN public.school_announcements.target_audience IS 'staff | parents | all';