
ALTER TABLE public.spp_invoices ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone;
ALTER TABLE public.spp_invoices ADD COLUMN IF NOT EXISTS regenerated_from uuid;
ALTER TABLE public.spp_invoices DROP CONSTRAINT IF EXISTS spp_invoices_school_id_student_id_period_year_period_month_key;
CREATE INDEX IF NOT EXISTS idx_spp_invoices_period_active ON public.spp_invoices(school_id, student_id, period_year, period_month) WHERE status IN ('pending','unpaid');
