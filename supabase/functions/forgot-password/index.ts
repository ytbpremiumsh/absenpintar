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

    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email tidak ditemukan di sistem' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    let schoolId = profile?.school_id || null;
    let integration = null;

    if (schoolId) {
      // User has a school - check their school's WA integration
      const { data: intData } = await supabaseAdmin
        .from('school_integrations')
        .select('api_url, api_key, is_active')
        .eq('school_id', schoolId)
        .eq('integration_type', 'onesender')
        .maybeSingle();
      integration = intData;
    }

    // If no school or no integration found, try to find ANY active WA integration (fallback for super admins)
    if (!integration?.is_active || !integration?.api_url || !integration?.api_key) {
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
        integration = fallback;
        if (!schoolId) schoolId = fallback.school_id;
      }
    }

    const hasWa = !!(integration?.is_active && integration?.api_url && integration?.api_key);

    return new Response(JSON.stringify({
      success: true,
      user_name: profile?.full_name || email,
      has_wa_integration: hasWa,
      school_id: schoolId || '',
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
