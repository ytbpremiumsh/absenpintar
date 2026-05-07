import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizePhone = (p: string) => {
  let n = (p || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.substring(1);
  return n;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { action, school_id, otp_code } = await req.json();
    if (!action || !school_id) return json({ error: "params missing" });

    // Lookup confirmer
    const { data: settings } = await admin
      .from("bendahara_settings")
      .select("confirmer_user_id")
      .eq("school_id", school_id)
      .maybeSingle();

    const confirmerId: string | null = (settings as any)?.confirmer_user_id || null;
    if (!confirmerId) return json({ error: "Penanggung jawab OTP belum diatur. Hubungi Admin Sekolah." });

    const { data: prof } = await admin
      .from("profiles")
      .select("phone, full_name")
      .eq("user_id", confirmerId)
      .maybeSingle();

    const phone = (prof as any)?.phone;
    const name = (prof as any)?.full_name || "Penanggung Jawab";
    if (!phone) return json({ error: "Penanggung jawab belum punya nomor WhatsApp di profil." });

    if (action === "send") {
      // Generate OTP 6 digit
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Invalidate old
      await admin.from("bendahara_otps").update({ used: true })
        .eq("school_id", school_id).eq("used", false);
      // Insert
      await admin.from("bendahara_otps").insert({
        school_id, phone, otp_code: code,
      });

      // Get school name
      const { data: school } = await admin.from("schools").select("name").eq("id", school_id).maybeSingle();
      const schoolName = (school as any)?.name || "Sekolah";

      const message = `*${schoolName} — Konfirmasi Pencairan SPP*\n\nYth. ${name},\n\nKode OTP konfirmasi pencairan dana SPP:\n\n*${code}*\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapapun.\n\n_Pesan otomatis ATSkolla_`;

      // Send via WA
      const waRes = await admin.functions.invoke("send-whatsapp", {
        body: { school_id, phone, message, message_type: "bendahara_otp" },
      });
      if (waRes.error) return json({ error: "Gagal kirim WA: " + (waRes.error.message || "unknown") });

      // Mask phone
      const masked = phone.replace(/(\d{2,4})\d+(\d{3})/, "$1****$2");
      return json({ success: true, phone_masked: masked, name });
    }

    if (action === "verify") {
      if (!otp_code) return json({ error: "OTP wajib diisi" });
      const { data: rec } = await admin
        .from("bendahara_otps")
        .select("*")
        .eq("school_id", school_id)
        .eq("otp_code", otp_code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!rec) return json({ error: "Kode OTP salah atau sudah kedaluwarsa" });
      await admin.from("bendahara_otps").update({ used: true }).eq("id", (rec as any).id);
      return json({ success: true });
    }

    return json({ error: "action tidak dikenal" });
  } catch (e: any) {
    console.error("[bendahara-otp]", e);
    return json({ error: e?.message || "internal error" });
  }
});
