import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  event_name?: string;
  event_source_url?: string;
  event_id?: string;
  test_event_code?: string;
  user_data?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["meta_pixel_id", "meta_capi_access_token", "meta_test_event_code", "meta_pixel_enabled"]);

    const m = Object.fromEntries((settings || []).map((d: any) => [d.key, d.value]));
    const pixelId = m.meta_pixel_id;
    const accessToken = m.meta_capi_access_token;

    if (!pixelId || !accessToken) {
      return new Response(JSON.stringify({ success: false, error: "Pixel ID atau Access Token belum dikonfigurasi" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Body = await req.json().catch(() => ({}));
    const eventName = body.event_name || "PageView";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ua = req.headers.get("user-agent") || "";

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: body.event_source_url || "",
          event_id: body.event_id,
          user_data: {
            client_ip_address: ip,
            client_user_agent: ua,
            ...(body.user_data || {}),
          },
          custom_data: body.custom_data || {},
        },
      ],
      ...(body.test_event_code || m.meta_test_event_code
        ? { test_event_code: body.test_event_code || m.meta_test_event_code }
        : {}),
    };

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok || json.error) {
      return new Response(
        JSON.stringify({ success: false, error: json.error?.message || `HTTP ${res.status}`, raw: json }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, events_received: json.events_received, fbtrace_id: json.fbtrace_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
