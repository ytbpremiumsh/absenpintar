import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MPWA_BASE = 'https://app.ayopintar.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, school_id, sender } = await req.json();

    if (!action || !school_id) {
      return new Response(JSON.stringify({ error: 'action and school_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Resolve API Key: school_integrations first, then platform_settings
    let finalApiKey = '';
    const { data: integration } = await supabaseAdmin
      .from('school_integrations')
      .select('mpwa_api_key, mpwa_sender')
      .eq('school_id', school_id)
      .eq('integration_type', 'onesender')
      .maybeSingle();

    if (integration?.mpwa_api_key) {
      finalApiKey = integration.mpwa_api_key;
    }

    if (!finalApiKey) {
      const { data: platformSettings } = await supabaseAdmin
        .from('platform_settings')
        .select('key, value')
        .eq('key', 'mpwa_platform_api_key')
        .maybeSingle();
      if (platformSettings?.value) {
        finalApiKey = platformSettings.value;
      }
    }

    if (!finalApiKey) {
      return new Response(JSON.stringify({ error: 'MPWA API Key belum dikonfigurasi. Hubungi administrator.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const finalSender = sender || integration?.mpwa_sender || '';

    // Safe JSON parser
    const safeJson = async (res: Response) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        console.error('MPWA API returned non-JSON:', text.substring(0, 200));
        return { status: false, msg: 'MPWA API returned invalid response', raw: text.substring(0, 200) };
      }
    };

    // Helper: check if response means "already connected"
    const isConnected = (data: any) =>
      data?.msg === 'Device already connected!' ||
      data?.msg === 'Perangkat sudah terhubung!' ||
      (data?.status === true && !data?.qrcode);

    // ═══ CONNECT: Register device + Generate QR (one-click) ═══
    if (action === 'connect') {
      if (!finalSender) {
        return new Response(JSON.stringify({ error: 'Nomor WhatsApp (sender) harus diisi terlebih dahulu' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save sender to school_integrations
      await supabaseAdmin
        .from('school_integrations')
        .update({ mpwa_sender: finalSender, gateway_type: 'mpwa' })
        .eq('school_id', school_id)
        .eq('integration_type', 'onesender');

      // Step 1: Register device via API (try multiple endpoint patterns)
      console.log(`Registering device: ${finalSender}`);
      for (const endpoint of ['/api/add-device', '/add-device']) {
        try {
          const addRes = await fetch(`${MPWA_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: finalApiKey, device: finalSender }),
          });
          const addData = await safeJson(addRes);
          console.log(`${endpoint} result:`, JSON.stringify(addData));
          if (addData.status !== false) break; // success, stop trying
        } catch (e) {
          console.error(`${endpoint} error (non-fatal):`, e.message);
        }
      }

      // Step 2: Generate QR code
      const qrUrl = `${MPWA_BASE}/generate-qr?api_key=${encodeURIComponent(finalApiKey)}&device=${encodeURIComponent(finalSender)}`;
      const res = await fetch(qrUrl, { method: 'GET' });
      const data = await safeJson(res);

      if (isConnected(data)) {
        await supabaseAdmin
          .from('school_integrations')
          .update({ mpwa_connected: true })
          .eq('school_id', school_id)
          .eq('integration_type', 'onesender');
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ POLL: Check connection status via QR endpoint ═══
    if (action === 'poll-status') {
      if (!finalSender) {
        return new Response(JSON.stringify({ error: 'Sender tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qrUrl = `${MPWA_BASE}/generate-qr?api_key=${encodeURIComponent(finalApiKey)}&device=${encodeURIComponent(finalSender)}`;
      const res = await fetch(qrUrl, { method: 'GET' });
      const data = await safeJson(res);

      if (isConnected(data)) {
        await supabaseAdmin
          .from('school_integrations')
          .update({ mpwa_connected: true })
          .eq('school_id', school_id)
          .eq('integration_type', 'onesender');
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ DISCONNECT ═══
    if (action === 'disconnect') {
      if (!finalSender) {
        return new Response(JSON.stringify({ error: 'Sender tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${MPWA_BASE}/logout-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: finalApiKey, sender: finalSender }),
      });
      const data = await safeJson(res);

      await supabaseAdmin
        .from('school_integrations')
        .update({ mpwa_connected: false })
        .eq('school_id', school_id)
        .eq('integration_type', 'onesender');

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('MPWA QR error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
