import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { brandPaymentUrl } from "../_shared/brandUrl.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-parent-token",
};

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// Mayar payment link expires in 14 days; we cap our logical expiry to that
const MAYAR_LINK_TTL_DAYS = 14;

function buildInvoiceTitle(inv: { student_name: string; class_name: string; period_label: string }) {
  return `${inv.student_name} – ${inv.class_name} – ${inv.period_label}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createMayarLink(apiKey: string, inv: any, attempt = 0): Promise<{ ok: boolean; json: any; expiry: Date; status: number }> {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + MAYAR_LINK_TTL_DAYS);
  // Unique suffix to bypass Mayar's "duplicate request" dedupe (which compares
  // recent payloads). We embed an invisible token in the description, which
  // does not affect what the user sees on the payment page meaningfully.
  const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // Mayar requires integer amount (IDR, no decimals). Force-cast to avoid
  // mismatch when DB returns numeric/string with decimals.
  const safeAmount = Math.max(1000, Math.round(Number(inv.total_amount) || 0));
  const payload = {
    name: `${buildInvoiceTitle(inv)} #${uniq.slice(-6).toUpperCase()}`,
    amount: safeAmount,
    description: `Pembayaran SPP ${inv.period_label} — ${inv.student_name} (${inv.class_name}) — Total Rp ${safeAmount.toLocaleString("id-ID")} [${uniq}]`,
    email: "spp@atskolla.com",
    mobile: (inv.parent_phone || "08000000000").replace(/\D/g, ""),
    redirectUrl: "https://atskolla.com/parent",
    merchantName: "ATSkolla",
    expiredAt: expiry.toISOString(),
  };
  const res = await fetch("https://api.mayar.id/hl/v1/payment/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));

  // Retry on 429 (Mayar rate-limit / duplicate detection) with longer backoff
  const isDuplicate = res.status === 429 || /duplicate/i.test(json?.message || "");
  if (isDuplicate && attempt < 5) {
    const backoff = 2000 + attempt * 2000 + Math.floor(Math.random() * 1200);
    console.log(`Mayar 429/duplicate — retry #${attempt + 1} after ${backoff}ms`);
    await sleep(backoff);
    return createMayarLink(apiKey, inv, attempt + 1);
  }

  return { ok: res.ok && !!json?.data?.link, json, expiry, status: res.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ok = (data: any) => new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const err = (m: string) => new Response(JSON.stringify({ success: false, error: m }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const action = body.action as string;

    // ====== PARENT ACTION (no school auth, uses parent token) ======
    if (action === "parent_create_payment") {
      const parentToken = req.headers.get("x-parent-token") || body.parent_token;
      if (!parentToken) return err("Unauthorized");
      const { data: ses } = await supabaseAdmin.from("parent_sessions").select("phone, expires_at").eq("token", parentToken).maybeSingle();
      if (!ses || new Date(ses.expires_at).getTime() < Date.now()) return err("Sesi tidak valid");

      const invoiceId = body.invoice_id as string;
      const { data: inv } = await supabaseAdmin.from("spp_invoices").select("*").eq("id", invoiceId).maybeSingle();
      if (!inv) return err("Invoice tidak ditemukan");
      if (inv.status === "paid") return err("Invoice sudah lunas");

      // Verify parent owns the invoice via the student's CURRENT parent_phone
      // (invoice's snapshot parent_phone may be stale/wrong; trust the student record)
      const { data: studentRow } = await supabaseAdmin
        .from("students")
        .select("parent_phone")
        .eq("id", inv.student_id)
        .maybeSingle();

      const phoneVariants = (raw: string): string[] => {
        const digits = (raw || "").replace(/\D/g, "");
        const v = new Set<string>();
        if (!digits) return [];
        v.add(digits);
        if (digits.startsWith("62")) { v.add("0" + digits.slice(2)); v.add(digits.slice(2)); }
        if (digits.startsWith("0")) { v.add("62" + digits.slice(1)); v.add(digits.slice(1)); }
        if (digits.startsWith("8")) { v.add("62" + digits); v.add("0" + digits); }
        return Array.from(v);
      };
      const sesVariants = phoneVariants(ses.phone || "");
      const studentVariants = phoneVariants(studentRow?.parent_phone || "");
      const invVariants = phoneVariants(inv.parent_phone || "");
      const owned =
        sesVariants.some((p) => studentVariants.includes(p)) ||
        sesVariants.some((p) => invVariants.includes(p));
      if (!owned) return err("Akses ditolak");

      const result = await ensureFreshLink(supabaseAdmin, inv);
      if (!result.success) return err(result.error || "Gagal");
      return ok({ payment_url: brandPaymentUrl(result.payment_url), invoice_id: result.invoice_id });
    }

    // ====== SCHOOL ACTIONS (require school admin/bendahara JWT) ======
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return err("Unauthorized");
    const { data: claimsRes, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
    if (claimsErr || !claimsRes?.claims) return err("Unauthorized");
    const userId = claimsRes.claims.sub as string;

    const { data: profile } = await supabaseAdmin.from("profiles").select("school_id").eq("user_id", userId).maybeSingle();
    const schoolId = profile?.school_id;
    if (!schoolId) return err("Akun tidak terhubung sekolah");

    // ====== TEST CONNECTION ======
    if (action === "test_connection") {
      const apiKey = Deno.env.get("MAYAR_API_KEY");
      if (!apiKey) return ok({ connected: false, message: "MAYAR_API_KEY belum di-set" });
      try {
        const res = await fetch("https://api.mayar.id/hl/v1/payment/create", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test Koneksi - ATSkolla", amount: 1000, description: "test", email: "test@atskolla.com", mobile: "08000000000" }),
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

    // ====== CREATE / REGENERATE PAYMENT LINK ======
    if (action === "create_payment_link" || action === "regenerate_payment_link") {
      const { invoice_id } = body;
      const { data: inv } = await supabaseAdmin.from("spp_invoices").select("*").eq("id", invoice_id).eq("school_id", schoolId).maybeSingle();
      if (!inv) return err("Invoice tidak ditemukan");
      if (inv.status === "paid") return err("Invoice sudah dibayar");

      const result = await ensureFreshLink(supabaseAdmin, inv, action === "regenerate_payment_link");
      if (!result.success) return err(result.error || "Gagal");
      return ok({ payment_url: brandPaymentUrl(result.payment_url), invoice_id: result.invoice_id });
    }

    return err("Unknown action");
  } catch (e: any) {
    console.error("spp-mayar error:", e);
    return err(e.message || "Internal error");
  }
});

// ─────────────────────────────────────────────
// Core: ensure invoice has a non-expired Mayar link.
// If link is fresh → return as-is.
// If link expired or absent → mark old as 'expired', create new invoice (regenerated_from), new link.
// ─────────────────────────────────────────────
async function ensureFreshLink(
  supabaseAdmin: any,
  inv: any,
  forceRegen = false,
): Promise<{ success: boolean; payment_url?: string; invoice_id?: string; error?: string }> {
  const apiKey = Deno.env.get("MAYAR_API_KEY");
  if (!apiKey) return { success: false, error: "MAYAR_API_KEY belum dikonfigurasi" };

  const now = Date.now();
  const isExpired = inv.expired_at ? new Date(inv.expired_at).getTime() < now : false;

  // Reuse if fresh & not forced
  if (!forceRegen && inv.payment_url && !isExpired) {
    return { success: true, payment_url: inv.payment_url, invoice_id: inv.id };
  }

  // If expired or forced regen → mark current invoice as 'expired' (only if not paid and has prior link)
  let parentInvoiceId = inv.id;
  if ((isExpired || forceRegen) && inv.status !== "paid") {
    if (inv.payment_url || forceRegen) {
      // Mark old as expired and create a fresh row to keep history intact
      await supabaseAdmin.from("spp_invoices").update({ status: "expired" }).eq("id", inv.id);

      const newRow = {
        school_id: inv.school_id,
        student_id: inv.student_id,
        invoice_number: `${inv.invoice_number}-R${Date.now().toString(36).slice(-4).toUpperCase()}`,
        student_name: inv.student_name,
        class_name: inv.class_name,
        parent_name: inv.parent_name,
        parent_phone: inv.parent_phone,
        period_month: inv.period_month,
        period_year: inv.period_year,
        period_label: inv.period_label,
        description: `${inv.student_name} – ${inv.class_name} – ${inv.period_label}`,
        amount: inv.amount,
        denda: inv.denda || 0,
        total_amount: inv.total_amount,
        due_date: inv.due_date,
        status: "pending",
        regenerated_from: inv.id,
      };
      const { data: created, error } = await supabaseAdmin.from("spp_invoices").insert(newRow).select().single();
      if (error || !created) return { success: false, error: error?.message || "Gagal membuat tagihan baru" };
      inv = created;
      parentInvoiceId = created.id;
    }
  }

  // Create Mayar link
  const linkRes = await createMayarLink(apiKey, inv);
  await supabaseAdmin.from("spp_logs").insert({
    school_id: inv.school_id,
    invoice_id: inv.id,
    event_type: "create_invoice",
    status: linkRes.ok ? "ok" : "error",
    payload: linkRes.json,
    message: linkRes.json?.message || null,
  });
  if (!linkRes.ok) return { success: false, error: linkRes.json?.message || "Gagal create payment di Mayar" };

  const link = linkRes.json.data;
  const mayarId = link.id || link.paymentLinkId || link.paymentLinkID || null;
  const mayarTransactionId = link.transactionId || link.transaction_id || null;
  await supabaseAdmin.from("spp_invoices").update({
    mayar_invoice_id: mayarId,
    payment_url: link.link || null,
    expired_at: linkRes.expiry.toISOString(),
  }).eq("id", inv.id);

  // Bridge to payment_transactions for webhook compatibility
  const { data: anyPlan } = await supabaseAdmin.from("subscription_plans").select("id").limit(1).maybeSingle();
  await supabaseAdmin.from("payment_transactions").insert({
    school_id: inv.school_id,
    plan_id: anyPlan?.id || inv.school_id,
    amount: inv.total_amount,
    status: "pending",
    mayar_transaction_id: mayarId || mayarTransactionId,
    mayar_payment_url: link.link || null,
    payment_method: "spp",
  });

  return { success: true, payment_url: link.link, invoice_id: parentInvoiceId };
}
