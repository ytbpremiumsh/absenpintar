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
    if (!email || !phone || !school_id) {
      return new Response(JSON.stringify({ error: 'Email, phone, dan school_id wajib diisi' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email tidak ditemukan' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // Store new OTP (expires in 5 minutes)
    await supabaseAdmin.from('password_reset_otps').insert({
      email: email.toLowerCase(),
      otp_code: otpCode,
      phone: phone,
    });

    // Get WA integration
    const { data: integration } = await supabaseAdmin
      .from('school_integrations')
      .select('api_url, api_key, is_active')
      .eq('school_id', school_id)
      .eq('integration_type', 'onesender')
      .maybeSingle();

    if (!integration?.is_active || !integration?.api_url || !integration?.api_key) {
      return new Response(JSON.stringify({ error: 'Integrasi WhatsApp sekolah belum dikonfigurasi atau tidak aktif' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format phone
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }

    // Send OTP via WhatsApp
    const message = `🔐 *Kode OTP Reset Password ATSkolla*\n\nKode OTP Anda: *${otpCode}*\n\nKode ini berlaku selama 5 menit.\n⚠️ Jangan bagikan kode ini kepada siapapun.\n\n_Pesan otomatis dari ATSkolla_`;

    const waResponse = await fetch(integration.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!waResponse.ok) {
      const errData = await waResponse.json();
      console.error('WhatsApp send error:', errData);
      return new Response(JSON.stringify({ error: 'Gagal mengirim OTP via WhatsApp' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the message
    await supabaseAdmin.from('wa_message_logs').insert({
      school_id,
      phone,
      message: 'Kode OTP Reset Password',
      message_type: 'otp',
      status: 'sent',
      student_name: null,
    });

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
