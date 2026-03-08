
-- Add attendance_type column to attendance_logs (datang = arrival, pulang = departure)
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS attendance_type text NOT NULL DEFAULT 'datang';

-- Add attendance time settings to pickup_settings
ALTER TABLE public.pickup_settings ADD COLUMN IF NOT EXISTS attendance_start_time time DEFAULT '06:00:00';
ALTER TABLE public.pickup_settings ADD COLUMN IF NOT EXISTS attendance_end_time time DEFAULT '12:00:00';
ALTER TABLE public.pickup_settings ADD COLUMN IF NOT EXISTS departure_start_time time DEFAULT '12:00:00';
ALTER TABLE public.pickup_settings ADD COLUMN IF NOT EXISTS departure_end_time time DEFAULT '17:00:00';
