import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ok = (data: any) => new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const err = (m: string) => new Response(JSON.stringify({ success: false, error: m }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return err("Unauthorized");
    const { data: claimsRes, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
    if (claimsErr || !claimsRes?.claims) return err("Unauthorized");
    const userId = claimsRes.claims.sub as string;

    const { data: profile } = await supabaseAdmin.from("profiles").select("school_id").eq("user_id", userId).maybeSingle();
    const schoolId = profile?.school_id;
    if (!schoolId) return err("Akun tidak terhubung sekolah");

    const body = await req.json();
    const action = body.action as string;

    // ====== TEST CONNECTION ======
    if (action === "test_connection") {
      const apiKey = Deno.env.get("MAYAR_API_KEY");
      if (!apiKey) return ok({ connected: false, message: "MAYAR_API_KEY belum di-set" });
      try {
        const res = await fetch("https://api.mayar.id/hl/v1/payment/create", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test Koneksi", amount: 1000, description: "test", email: "test@atskolla.com", mobile: "08000000000" }),
        });
        const json = await res.json();
        const connected = res.ok && json?.data?.link;
        await supabaseAdmin.from("bendahara_settings").upsert({
          school_id: schoolId,
          last_test_status: connected ? "connected" : "failed",
          last_tested_at: new Date().toISOString(),
        }, { onConflict: "school_id" });
        return ok({ connected, message: connected ? "Mayar Connected" : (json?.message || "Connection Failed") });
      } catch (e: any) {
        return ok({ connected: false, message: e.message });
      }
    }

    // ====== CREATE INVOICE (single) ======
    if (action === "create_payment_link") {
      const { invoice_id } = body;
      const { data: inv } = await supabaseAdmin.from("spp_invoices").select("*").eq("id", invoice_id).eq("school_id", schoolId).maybeSingle();
      if (!inv) return err("Invoice tidak ditemukan");
      if (inv.status === "paid") return err("Invoice sudah dibayar");
      if (inv.payment_url) return ok({ payment_url: inv.payment_url, invoice: inv });

      const apiKey = Deno.env.get("MAYAR_API_KEY");
      if (!apiKey) return err("MAYAR_API_KEY belum dikonfigurasi");

      const expiry = new Date(); expiry.setDate(expiry.getDate() + 14);
      const payload = {
        name: `SPP ${inv.period_label}`,
        amount: inv.total_amount,
        description: inv.description,
        email: "spp@atskolla.com",
        mobile: (inv.parent_phone || "08000000000").replace(/\D/g, ""),
        redirectUrl: "https://atskolla.com/parent",
      };
      const mayarRes = await fetch("https://api.mayar.id/hl/v1/payment/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const mayarJson = await mayarRes.json();
      await supabaseAdmin.from("spp_logs").insert({
        school_id: schoolId, invoice_id: inv.id, event_type: "create_invoice",
        status: mayarRes.ok ? "ok" : "error", payload: mayarJson, message: mayarJson?.message || null,
      });
      if (!mayarRes.ok || !mayarJson?.data?.link) return err(mayarJson?.message || "Gagal create payment di Mayar");

      const link = mayarJson.data;
      await supabaseAdmin.from("spp_invoices").update({
        mayar_invoice_id: link.id || null,
        payment_url: link.link || null,
      }).eq("id", inv.id);

      // Create payment_transactions row for webhook compatibility
      const { data: anyPlan } = await supabaseAdmin.from("subscription_plans").select("id").limit(1).maybeSingle();
      await supabaseAdmin.from("payment_transactions").insert({
        school_id: schoolId,
        plan_id: anyPlan?.id || schoolId,
        amount: inv.total_amount,
        status: "pending",
        mayar_transaction_id: link.id || null,
        mayar_payment_url: link.link || null,
        payment_method: "spp",
      });

      return ok({ payment_url: link.link, mayar_id: link.id });
    }

    return err("Unknown action");
  } catch (e: any) {
    console.error("spp-mayar error:", e);
    return err(e.message || "Internal error");
  }
});
