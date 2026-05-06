
REVOKE EXECUTE ON FUNCTION public.notify_admin_wa(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_admin_support_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_admin_withdrawal() FROM PUBLIC, anon, authenticated;
