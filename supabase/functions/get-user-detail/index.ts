import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error('Unauthorized');

    const { data: rolesData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', caller.id);
    const callerRoles = (rolesData || []).map((r: any) => r.role);
    if (!callerRoles.includes('school_admin') && !callerRoles.includes('super_admin')) {
      throw new Error('Insufficient permissions');
    }

    const { user_id } = await req.json();
    if (!user_id) throw new Error('user_id is required');

    const { data: prof } = await supabaseAdmin
      .from('profiles').select('phone, nip').eq('user_id', user_id).maybeSingle();

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user_id);

    return new Response(JSON.stringify({
      success: true,
      email: authData?.user?.email || '',
      phone: prof?.phone || '',
      nip: (prof as any)?.nip || '',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
