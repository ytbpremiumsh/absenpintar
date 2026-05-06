-- Mark older duplicate pending SPP invoices as expired, keep only the newest pending per (student, period)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY school_id, student_id, period_month, period_year
      ORDER BY created_at DESC
    ) AS rn
  FROM public.spp_invoices
  WHERE status = 'pending'
)
UPDATE public.spp_invoices si
SET status = 'expired', payment_url = NULL, mayar_invoice_id = NULL, expired_at = now()
FROM ranked r
WHERE si.id = r.id AND r.rn > 1;