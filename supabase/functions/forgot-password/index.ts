import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email wajib diisi' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find user by email via auth admin
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email tidak ditemukan di sistem' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile to find school_id, then find a phone number
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.school_id) {
      return new Response(JSON.stringify({ error: 'Profil pengguna tidak memiliki sekolah terkait' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get school admin phone - look for the user's own phone or use metadata
    // We'll use user metadata phone, or ask user to provide phone
    const userPhone = user.phone || user.user_metadata?.phone;

    // If no phone on user, try to find from school integration to send via WA
    const { data: integration } = await supabaseAdmin
      .from('school_integrations')
      .select('api_url, api_key, is_active')
      .eq('school_id', profile.school_id)
      .eq('integration_type', 'onesender')
      .maybeSingle();

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Mark old OTPs as used
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // We need a phone to send to - return error asking for phone if not found
    // For this flow, the frontend will send the phone number too
    return new Response(JSON.stringify({
      success: true,
      requires_phone: !userPhone,
      user_name: profile.full_name,
      has_wa_integration: !!(integration?.is_active && integration?.api_url && integration?.api_key),
      school_id: profile.school_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
