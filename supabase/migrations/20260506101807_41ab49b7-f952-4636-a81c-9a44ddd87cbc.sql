
-- 1) Default platform settings (only insert if missing)
INSERT INTO public.platform_settings (key, value)
VALUES
  ('admin_notify_phone', '089501123808'),
  ('admin_notify_enabled', 'true'),
  ('admin_notify_ticket_template',
   E'🎫 *Tiket Bantuan Baru*\n\nSekolah: {school}\nDari: {user}\nPrioritas: {priority}\nSubjek: {subject}\n\nPesan:\n{message}\n\nWaktu: {time}'),
  ('admin_notify_withdrawal_template',
   E'💰 *Pengajuan Pencairan Dana*\n\nAffiliate: {affiliate}\nEmail: {email}\nJumlah: {amount}\n\nBank: {bank}\nNo. Rekening: {account_number}\nA/N: {account_holder}\n\nWaktu: {time}')
ON CONFLICT (key) DO NOTHING;

-- 2) Helper function: call notify-admin-wa edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_admin_wa(_event_type text, _payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text := 'https://bohuglednqirnaearrkj.supabase.co/functions/v1/notify-admin-wa';
  _service_key text;
BEGIN
  -- Use anon-style service: pg_net only needs to fire & forget; we add Authorization for safety
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'event_type', _event_type,
      'payload', _payload
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Never fail the calling transaction
  NULL;
END;
$$;

-- 3) Trigger: support_tickets insert -> notify admin
CREATE OR REPLACE FUNCTION public.trg_notify_admin_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _school_name text;
  _user_name text;
BEGIN
  SELECT name INTO _school_name FROM public.schools WHERE id = NEW.school_id;
  SELECT full_name INTO _user_name FROM public.profiles WHERE user_id = NEW.user_id;

  PERFORM public.notify_admin_wa('support_ticket', jsonb_build_object(
    'school', COALESCE(_school_name, '-'),
    'user', COALESCE(_user_name, '-'),
    'priority', COALESCE(NEW.priority, 'normal'),
    'subject', COALESCE(NEW.subject, '-'),
    'message', COALESCE(LEFT(NEW.message, 400), '-')
  ));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_notify_admin ON public.support_tickets;
CREATE TRIGGER support_tickets_notify_admin
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_admin_support_ticket();

-- 4) Trigger: affiliate_withdrawals insert -> notify admin
CREATE OR REPLACE FUNCTION public.trg_notify_admin_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _aff_name text;
  _aff_email text;
BEGIN
  SELECT full_name, email INTO _aff_name, _aff_email
  FROM public.affiliates WHERE id = NEW.affiliate_id;

  PERFORM public.notify_admin_wa('withdrawal_request', jsonb_build_object(
    'affiliate', COALESCE(_aff_name, '-'),
    'email', COALESCE(_aff_email, '-'),
    'amount', NEW.amount,
    'bank', COALESCE(NEW.bank_name, '-'),
    'account_number', COALESCE(NEW.account_number, '-'),
    'account_holder', COALESCE(NEW.account_holder, '-')
  ));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS affiliate_withdrawals_notify_admin ON public.affiliate_withdrawals;
CREATE TRIGGER affiliate_withdrawals_notify_admin
AFTER INSERT ON public.affiliate_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_admin_withdrawal();
