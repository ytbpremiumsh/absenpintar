-- Capture invoice ids first
WITH inv AS (
  SELECT id, mayar_invoice_id FROM public.spp_invoices
  WHERE student_id = 'af3c36f5-d7f7-449f-9128-10c61750ddef'
)
DELETE FROM public.payment_transactions
WHERE payment_method = 'spp'
  AND mayar_transaction_id IN (SELECT mayar_invoice_id FROM inv WHERE mayar_invoice_id IS NOT NULL);

DELETE FROM public.spp_logs
WHERE invoice_id IN (
  SELECT id FROM public.spp_invoices WHERE student_id = 'af3c36f5-d7f7-449f-9128-10c61750ddef'
);

DELETE FROM public.spp_invoices
WHERE student_id = 'af3c36f5-d7f7-449f-9128-10c61750ddef';