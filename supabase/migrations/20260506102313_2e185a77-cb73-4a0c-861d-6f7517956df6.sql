
CREATE OR REPLACE FUNCTION public.trg_notify_admin_bendahara_settlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_notify_admin_bendahara_settlement() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS spp_settlements_notify_admin ON public.spp_settlements;
CREATE TRIGGER spp_settlements_notify_admin
AFTER INSERT ON public.spp_settlements
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_admin_bendahara_settlement();

INSERT INTO public.platform_settings (key, value)
VALUES (
  'admin_notify_bendahara_template',
  E'🏦 *Pencairan Dana Bendahara*\n\nSekolah: {school}\nDiajukan oleh: {requester}\nKode: {settlement_code}\n\nJumlah Transaksi: {total_transactions}\nGross: {total_gross}\nFee Gateway: {total_gateway_fee}\nNet: {total_net}\nFee Pencairan: {withdraw_fee}\n\n💰 *Pencairan Final: {final_payout}*\n\nBank: {bank}\nNo. Rek: {account_number}\nA/N: {account_holder}\n\nCatatan: {notes}\nWaktu: {time}'
)
ON CONFLICT (key) DO NOTHING;
