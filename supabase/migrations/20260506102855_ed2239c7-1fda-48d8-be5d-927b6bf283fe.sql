
-- Helper: format Rupiah singkat
CREATE OR REPLACE FUNCTION public._fmt_idr(amt bigint)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'Rp ' || to_char(amt, 'FM999G999G999G999')
$$;

-- Tiket Bantuan
CREATE OR REPLACE FUNCTION public.trg_notify_admin_support_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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

  -- Lonceng Super Admin (global notification, school_id NULL, created_by NULL = system)
  INSERT INTO public.notifications (school_id, title, message, type)
  VALUES (
    NULL,
    'Tiket Bantuan Baru',
    COALESCE(_school_name,'-') || ' — ' || COALESCE(NEW.subject,'-') || ' (oleh ' || COALESCE(_user_name,'-') || ')',
    'info'
  );

  RETURN NEW;
END;
$function$;

-- Pencairan Affiliate
CREATE OR REPLACE FUNCTION public.trg_notify_admin_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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

  INSERT INTO public.notifications (school_id, title, message, type)
  VALUES (
    NULL,
    'Pencairan Affiliate',
    COALESCE(_aff_name,'-') || ' meminta pencairan ' || public._fmt_idr(NEW.amount) || ' ke ' || COALESCE(NEW.bank_name,'-'),
    'warning'
  );

  RETURN NEW;
END;
$function$;

-- Pencairan Bendahara (SPP)
CREATE OR REPLACE FUNCTION public.trg_notify_admin_bendahara_settlement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  _school_name text;
  _requester_name text;
BEGIN
  SELECT name INTO _school_name FROM public.schools WHERE id = NEW.school_id;
  SELECT full_name INTO _requester_name FROM public.profiles WHERE user_id = NEW.requested_by;

  PERFORM public.notify_admin_wa('bendahara_settlement', jsonb_build_object(
    'school', COALESCE(_school_name, '-'),
    'requester', COALESCE(_requester_name, '-'),
    'settlement_code', COALESCE(NEW.settlement_code, '-'),
    'total_transactions', NEW.total_transactions,
    'total_gross', NEW.total_gross,
    'total_gateway_fee', NEW.total_gateway_fee,
    'total_net', NEW.total_net,
    'withdraw_fee', NEW.withdraw_fee,
    'final_payout', NEW.final_payout,
    'bank', COALESCE(NEW.bank_name, '-'),
    'account_number', COALESCE(NEW.account_number, '-'),
    'account_holder', COALESCE(NEW.account_holder, '-'),
    'notes', COALESCE(NEW.notes, '-')
  ));

  INSERT INTO public.notifications (school_id, title, message, type)
  VALUES (
    NULL,
    'Pencairan Bendahara (SPP)',
    COALESCE(_school_name,'-') || ' — ' || COALESCE(NEW.settlement_code,'-') || ' • ' || public._fmt_idr(NEW.final_payout) || ' ke ' || COALESCE(NEW.bank_name,'-'),
    'warning'
  );

  RETURN NEW;
END;
$function$;
