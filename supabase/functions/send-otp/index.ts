import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, phone, school_id } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email wajib diisi' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user exists and get stored phone
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email tidak ditemukan' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get stored phone from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('user_id', user.id)
      .maybeSingle();

    const storedPhone = profile?.phone;
    let targetPhone = storedPhone;

    if (phone) {
      const normalizePhone = (p: string) => {
        let n = p.replace(/\D/g, '');
        if (n.startsWith('62')) n = '0' + n.substring(2);
        return n;
      };
      const normalizedInput = normalizePhone(phone);
      const normalizedStored = storedPhone ? normalizePhone(storedPhone) : '';

      if (normalizedStored && normalizedInput !== normalizedStored) {
        return new Response(JSON.stringify({ error: 'Nomor WhatsApp tidak sesuai dengan data yang terdaftar' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetPhone = phone;
    }

    if (!targetPhone) {
      return new Response(JSON.stringify({ error: 'Nomor WhatsApp belum terdaftar di profil. Silakan hubungi admin.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Mark old OTPs as used
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Store new OTP
    await supabaseAdmin.from('password_reset_otps').insert({
      email: email.toLowerCase(),
      otp_code: otpCode,
      phone: targetPhone,
    });

    // Format phone
    let formattedPhone = targetPhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }

    const message = `🔐 *Kode OTP Reset Password ATSkolla*\n\nKode OTP Anda: *${otpCode}*\n\nKode ini berlaku selama 5 menit.\n⚠️ Jangan bagikan kode ini kepada siapapun.\n\n_Pesan otomatis dari ATSkolla_`;

    // ═══ Try to find a working gateway ═══
    let sent = false;

    // 1. Try school-specific integration (OneSender or MPWA)
    if (school_id) {
      const { data: intData } = await supabaseAdmin
        .from('school_integrations')
        .select('api_url, api_key, is_active, school_id, gateway_type, mpwa_api_key, mpwa_sender, mpwa_connected')
        .eq('school_id', school_id)
        .eq('integration_type', 'onesender')
        .maybeSingle();

      if (intData?.is_active) {
        if (intData.gateway_type === 'mpwa' && intData.mpwa_connected && intData.mpwa_sender) {
          // Use school's MPWA
          const mpwaApiKey = intData.mpwa_api_key || '';
          let apiKey = mpwaApiKey;
          if (!apiKey) {
            const { data: ps } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'mpwa_platform_api_key').maybeSingle();
            if (ps?.value) apiKey = ps.value;
          }
          if (apiKey) {
            sent = await sendViaMPWA(apiKey, intData.mpwa_sender, formattedPhone, message);
            if (sent) {
              await logMessage(supabaseAdmin, school_id, targetPhone, sent);
            }
          }
        } else if (intData.api_url && intData.api_key) {
          // Use school's OneSender
          sent = await sendViaOneSender(intData.api_url, intData.api_key, formattedPhone, message);
          if (sent) {
            await logMessage(supabaseAdmin, school_id, targetPhone, sent);
          }
        }
      }
    }

    // 2. Try platform-level MPWA
    if (!sent) {
      const { data: platformSettings } = await supabaseAdmin
        .from('platform_settings')
        .select('key, value')
        .in('key', ['mpwa_platform_api_key', 'mpwa_platform_sender', 'mpwa_platform_connected']);

      const ps: Record<string, string> = {};
      (platformSettings || []).forEach((s: any) => { ps[s.key] = s.value; });

      if (ps.mpwa_platform_connected === 'true' && ps.mpwa_platform_api_key && ps.mpwa_platform_sender) {
        console.log('[send-otp] Using platform MPWA sender:', ps.mpwa_platform_sender);
        sent = await sendViaMPWA(ps.mpwa_platform_api_key, ps.mpwa_platform_sender, formattedPhone, message);
      }
    }

    // 3. Fallback: any active OneSender integration
    if (!sent) {
      const { data: fallback } = await supabaseAdmin
        .from('school_integrations')
        .select('api_url, api_key, is_active, school_id')
        .eq('integration_type', 'onesender')
        .eq('is_active', true)
        .not('api_url', 'is', null)
        .not('api_key', 'is', null)
        .limit(1)
        .maybeSingle();

      if (fallback) {
        sent = await sendViaOneSender(fallback.api_url, fallback.api_key, formattedPhone, message);
        if (sent) {
          await logMessage(supabaseAdmin, fallback.school_id, targetPhone, sent);
        }
      }
    }

    if (!sent) {
      return new Response(JSON.stringify({ error: 'Tidak ada gateway WhatsApp yang aktif untuk mengirim OTP' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP berhasil dikirim via WhatsApp' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendViaMPWA(apiKey: string, sender: string, phone: string, message: string): Promise<boolean> {
  try {
    console.log(`[send-otp] MPWA sending to ${phone} via sender ${sender}`);
    const res = await fetch('https://app.ayopintar.com/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, sender, number: phone, message }),
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { status: false }; }
    console.log('[send-otp] MPWA response:', JSON.stringify(data).substring(0, 200));
    return data?.status !== false;
  } catch (e) {
    console.error('[send-otp] MPWA error:', e);
    return false;
  }
}

async function sendViaOneSender(apiUrl: string, apiKey: string, phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_type: 'individual', to: phone, type: 'text', text: { body: message } }),
    });
    return res.ok;
  } catch (e) {
    console.error('[send-otp] OneSender error:', e);
    return false;
  }
}

async function logMessage(supabaseAdmin: any, schoolId: string, phone: string, sent: boolean) {
  try {
    await supabaseAdmin.from('wa_message_logs').insert({
      school_id: schoolId,
      phone,
      message: 'Kode OTP Reset Password',
      message_type: 'otp',
      status: sent ? 'sent' : 'failed',
      student_name: null,
    });
  } catch { /* ignore */ }
}
