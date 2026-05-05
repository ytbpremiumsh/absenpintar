import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  platform: "facebook" | "instagram" | "tiktok" | "twitter" | "whatsapp" | "linkedin" | "blog";
  topic: string;
  tone: "profesional" | "santai" | "persuasif" | "edukatif" | "promo" | "storytelling";
  length: "pendek" | "sedang" | "panjang";
  cta?: string;
  audience?: string;
  variants?: number;
  hashtags?: boolean;
  emoji?: boolean;
}

const PRODUCT_CONTEXT = `
ATSkolla adalah aplikasi sistem absensi sekolah modern berbasis web.

Fitur Utama:
- Absensi via QR Code, Face Recognition (AI), dan Manual
- Notifikasi WhatsApp otomatis ke orang tua saat anak datang/pulang
- Multi-role: Super Admin, Admin Sekolah, Bendahara, Operator, Wali Kelas, Guru
- Dashboard Wali Kelas khusus untuk kelas yang diampu
- Manajemen siswa, kelas, jurusan, guru lengkap (CRUD + Import CSV)
- Laporan kehadiran PDF & Excel per kelas/periode
- Pembayaran SPP online via Mayar (auto-konfirmasi)
- Email notifikasi otomatis saat registrasi & SPP lunas
- Pengumuman sekolah & broadcast WhatsApp massal
- ID Card siswa (cetak portrait)
- Custom domain sekolah
- Backup database otomatis ke Google Drive
- Monitoring kehadiran real-time (publik & privat)
- Affiliate & Referral program
- Jadwal mengajar guru + reminder otomatis

Cocok untuk: SD, SMP, SMA, SMK, MA, Pesantren, dan lembaga pendidikan modern.
Slogan brand: ATSkolla — Absensi Sekolah Cerdas, Transparan, Real-time.
Warna brand: Biru-ungu #5B6CF9.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const b = (await req.json()) as Body;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY tidak tersedia" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const variants = Math.min(Math.max(b.variants || 1, 1), 5);
    const lengthGuide = {
      pendek: "70-120 kata",
      sedang: "150-250 kata",
      panjang: "300-450 kata",
    }[b.length];

    const platformGuide: Record<string, string> = {
      facebook: "Format Facebook: paragraf naratif yang engaging, gunakan baris kosong untuk readability, boleh emoji secukupnya, akhiri dengan CTA yang kuat. Hindari hashtag berlebihan (max 5).",
      instagram: "Format Instagram: hook kuat di kalimat pertama, gunakan baris pendek, emoji aktif, akhiri dengan 15-20 hashtag relevan di bawah.",
      tiktok: "Format TikTok caption: sangat singkat, hook agresif, 1-2 kalimat punchy, hashtag viral di akhir.",
      twitter: "Format Twitter/X thread atau single tweet: maksimal 280 karakter per tweet, padat, langsung ke poin.",
      whatsapp: "Format WhatsApp broadcast: salam pembuka ramah, bullet point jelas (pakai • atau ✓), CTA berupa link/nomor WA.",
      linkedin: "Format LinkedIn: profesional, fokus pada value bisnis & data/manfaat, paragraf rapi, akhiri dengan pertanyaan diskusi.",
      blog: "Format Blog/Artikel: paragraf terstruktur dengan heading, intro-isi-penutup yang jelas, SEO-friendly.",
    };

    const sys = `Kamu adalah copywriter marketing senior khusus produk SaaS pendidikan Indonesia. Tugasmu: membuat konten promosi yang konversi tinggi untuk produk ATSkolla.

KONTEKS PRODUK:
${PRODUCT_CONTEXT}

ATURAN OUTPUT:
- Bahasa Indonesia natural, mudah dipahami audiens guru/kepala sekolah/yayasan.
- Tidak boleh berbohong atau menyebut fitur yang tidak ada di konteks produk.
- Selalu sebut nama brand "ATSkolla" minimal 1x.
- Tone: ${b.tone}.
- Panjang: ${lengthGuide}.
- ${b.emoji === false ? "JANGAN gunakan emoji." : "Gunakan emoji secukupnya untuk memperkuat pesan."}
- ${b.hashtags === false ? "JANGAN sertakan hashtag." : "Sertakan hashtag relevan di akhir jika sesuai platform."}
- Platform: ${b.platform.toUpperCase()}. ${platformGuide[b.platform]}
${b.audience ? `- Target audiens: ${b.audience}.` : ""}
${b.cta ? `- CTA wajib: ${b.cta}` : "- Akhiri dengan CTA yang relevan (chat WA, daftar gratis, kunjungi website)."}

Hasilkan ${variants} varian caption berbeda. Pisahkan setiap varian dengan baris "---VARIAN-${"{nomor}"}---" di awal.`;

    const user = `Buatkan ${variants} varian konten ${b.platform} tentang topik: "${b.topic}"`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      if (r.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit AI. Coba lagi sebentar." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (r.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Kredit AI habis. Tambahkan saldo di Settings > Workspace > Usage." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "AI gateway error: " + txt }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "";
    // Split varian
    const parts = content.split(/---VARIAN-\d+---/i).map((s: string) => s.trim()).filter(Boolean);
    const result = parts.length ? parts : [content];

    return new Response(JSON.stringify({ success: true, variants: result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
