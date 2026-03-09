import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check super_admin role
    const { data: hasRole } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'super_admin' });
    if (!hasRole) throw new Error('Forbidden: Super admin only');

    const { payment_id, extend_months = 1 } = await req.json();
    if (!payment_id) throw new Error('payment_id is required');

    // Get payment
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, school_id, plan_id, status')
      .eq('id', payment_id)
      .single();
    if (payErr || !payment) throw new Error('Payment not found');
    if (payment.status === 'paid') throw new Error('Payment already approved');

    // Mark as paid
    await supabaseAdmin.from('payment_transactions').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'manual_approve',
    }).eq('id', payment.id);

    // Create or extend subscription
    const { data: existingSub } = await supabaseAdmin
      .from('school_subscriptions')
      .select('id, expires_at')
      .eq('school_id', payment.school_id)
      .eq('status', 'active')
      .maybeSingle();

    const now = new Date();
    let expiresAt: Date;

    if (existingSub?.expires_at) {
      const currentExpiry = new Date(existingSub.expires_at);
      expiresAt = currentExpiry > now ? currentExpiry : now;
    } else {
      expiresAt = now;
    }
    expiresAt.setMonth(expiresAt.getMonth() + extend_months);

    if (existingSub) {
      await supabaseAdmin.from('school_subscriptions')
        .update({ plan_id: payment.plan_id, expires_at: expiresAt.toISOString() })
        .eq('id', existingSub.id);
    } else {
      await supabaseAdmin.from('school_subscriptions').insert({
        school_id: payment.school_id,
        plan_id: payment.plan_id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
