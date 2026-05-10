import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendOtpMessage } from "../_shared/sendOtp.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, school_id } = await req.json();
    if (!user_id || !school_id) {
      return json({ error: 'user_id & school_id wajib' });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verifikasi role bendahara
    const { data: roleRow } = await admin.from('user_roles')
      .select('role').eq('user_id', user_id).eq('role', 'bendahara').maybeSingle();
    if (!roleRow) return json({ error: 'Akun ini tidak memiliki akses Bendahara' });

    // Ambil email & profile
    const { data: u } = await admin.auth.admin.getUserById(user_id);
    const email = u?.user?.email;
    if (!email) return json({ error: 'Email pengguna tidak ditemukan' });

    const { data: profile } = await admin.from('profiles')
      .select('phone, school_id, full_name').eq('user_id', user_id).maybeSingle();
    if (!profile?.phone) return json({ error: 'Nomor WhatsApp Bendahara belum diatur di profil' });
    if (profile.school_id !== school_id) return json({ error: 'Bendahara tidak terdaftar di sekolah ini' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tag = `bendahara:${email.toLowerCase()}`;

    await admin.from('password_reset_otps').update({ used: true })
      .eq('email', tag).eq('used', false);

    await admin.from('password_reset_otps').insert({
      email: tag, otp_code: otpCode, phone: profile.phone,
    });

    let formattedPhone = profile.phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);

    const message = `*Kode OTP Pencairan Dana ATSkolla*\n\nHalo ${profile.full_name || 'Bendahara'},\nKode OTP untuk konfirmasi pencairan dana SPP:\n\n*${otpCode}*\n\nBerlaku 5 menit. Jangan bagikan kode ini ke siapa pun.\nJika Anda tidak meminta pencairan, abaikan pesan ini.\n\n_Pesan otomatis dari ATSkolla_`;

    let sent = false;

    // Sekolah-level integration
    const { data: intData } = await admin
      .from('school_integrations')
      .select('api_url, api_key, is_active, gateway_type, mpwa_api_key, mpwa_sender, mpwa_connected')
      .eq('school_id', school_id).eq('integration_type', 'onesender').maybeSingle();

    if (intData?.is_active) {
      if (intData.gateway_type === 'mpwa' && intData.mpwa_connected && intData.mpwa_sender) {
        let apiKey = intData.mpwa_api_key || '';
        if (!apiKey) {
          const { data: ps } = await admin.from('platform_settings').select('value').eq('key', 'mpwa_platform_api_key').maybeSingle();
          if (ps?.value) apiKey = ps.value;
        }
        if (apiKey) sent = await sendMPWA(apiKey, intData.mpwa_sender, formattedPhone, message);
      } else if (intData.api_url && intData.api_key) {
        sent = await sendOneSender(intData.api_url, intData.api_key, formattedPhone, message);
      }
    }

    // Platform MPWA fallback
    if (!sent) {
      const { data: settings } = await admin.from('platform_settings').select('key,value')
        .in('key', ['mpwa_platform_api_key', 'mpwa_platform_sender', 'mpwa_platform_connected']);
      const ps: Record<string, string> = {};
      (settings || []).forEach((s: any) => { ps[s.key] = s.value; });
      if (ps.mpwa_platform_connected === 'true' && ps.mpwa_platform_api_key && ps.mpwa_platform_sender) {
        sent = await sendMPWA(ps.mpwa_platform_api_key, ps.mpwa_platform_sender, formattedPhone, message);
      }
    }

    if (!sent) return json({ error: 'Gateway WhatsApp belum aktif. Hubungi Super Admin.' });

    try {
      await admin.from('wa_message_logs').insert({
        school_id, phone: profile.phone, message: 'Kode OTP Pencairan',
        message_type: 'otp', status: 'sent', student_name: null,
      });
    } catch { /* ignore */ }

    // Mask phone untuk ditampilkan
    const masked = profile.phone.replace(/\d(?=\d{4})/g, '*');
    return json({ success: true, phone_masked: masked });
  } catch (e: any) {
    return json({ error: e.message || 'Terjadi kesalahan' });
  }
});

function json(body: any) {
  return new Response(JSON.stringify(body), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendMPWA(apiKey: string, sender: string, phone: string, message: string) {
  try {
    const res = await fetch('https://app.ayopintar.com/send-message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, sender, number: phone, message }),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { status: false }; }
    return data?.status !== false;
  } catch { return false; }
}

async function sendOneSender(apiUrl: string, apiKey: string, phone: string, message: string) {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_type: 'individual', to: phone, type: 'text', text: { body: message } }),
    });
    return res.ok;
  } catch { return false; }
}
