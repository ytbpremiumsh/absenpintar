import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBody {
  mode?: "generate";
  platform: "facebook" | "instagram" | "tiktok" | "twitter" | "whatsapp" | "linkedin" | "blog";
  content_type?: string; // caption, deskripsi_produk, artikel, iklan_fb, iklan_google, headline, email, script_video, dll
  topic: string;
  tone: string;
  length: "pendek" | "sedang" | "panjang";
  cta?: string;
  audience?: string;
  variants?: number;
  hashtags?: boolean;
  emoji?: boolean;
}

interface RewriteBody {
  mode: "rewrite";
  source_text: string;
  rewrite_style:
    | "improve" | "shorter" | "longer" | "professional" | "casual"
    | "persuasive" | "fix_grammar" | "translate_en" | "translate_id"
    | "engaging" | "seo" | "mimic" | "custom";
  custom_instruction?: string;
  reference_text?: string; // untuk mode mimic - contoh teks orang lain
  variants?: number;
  platform?: string;
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

Slogan brand: ATSkolla — Absensi Sekolah Cerdas, Transparan, Real-time.
Warna brand: Biru-ungu #5B6CF9.
`;

const REWRITE_STYLE_GUIDE: Record<string, string> = {
  improve: "Tingkatkan kualitas tulisan: lebih jelas, lebih engaging, alur lebih baik, tetap pertahankan inti pesan.",
  shorter: "Buat lebih ringkas, padat, hapus kalimat yang bertele-tele. Target ±50% lebih pendek dari aslinya.",
  longer: "Perluas teks dengan detail, contoh konkret, dan storytelling. Target ±2x lebih panjang dari aslinya.",
  professional: "Ubah gaya menjadi formal, profesional, cocok untuk dokumen bisnis / LinkedIn / proposal sekolah.",
  casual: "Ubah gaya menjadi santai, akrab, seperti ngobrol dengan teman. Boleh pakai sapaan ramah.",
  persuasive: "Buat lebih persuasif & sales-driven: hook kuat, sebut benefit jelas, urgency, CTA tegas.",
  fix_grammar: "Perbaiki ejaan, tanda baca, struktur kalimat, dan tata bahasa Indonesia. Jangan ubah makna.",
  translate_en: "Terjemahkan ke Bahasa Inggris yang natural & fasih (bukan terjemahan kaku).",
  translate_id: "Terjemahkan ke Bahasa Indonesia yang natural & fasih (bukan terjemahan kaku).",
  engaging: "Buat lebih engaging untuk media sosial: hook menarik di awal, gunakan emoji secukupnya, baris pendek.",
  seo: "Optimasi untuk SEO: gunakan kata kunci natural seputar 'absensi sekolah', 'aplikasi sekolah', struktur paragraf SEO-friendly, hindari keyword stuffing.",
  mimic: "TIRU GAYA & STRUKTUR teks referensi (lihat di bawah) sepersis mungkin, tapi ganti subjek/produk menjadi ATSkolla.",
  custom: "Ikuti instruksi custom dari user di bawah ini.",
};

const CONTENT_TYPE_GUIDE: Record<string, string> = {
  caption_sosmed: "Caption media sosial: hook 1 kalimat di awal, body singkat, CTA jelas di akhir. Cocok untuk feed FB/IG.",
  deskripsi_produk: "Deskripsi produk untuk landing page / marketplace: jelaskan WHAT, WHY, HOW, fitur utama dalam bullet, manfaat untuk user, akhiri dengan CTA.",
  iklan_fb: "Iklan Facebook Ads: format AIDA (Attention-Interest-Desire-Action). Headline pendek menohok, pain point audiens, solusi, social proof singkat, CTA tegas. Maksimal 125 karakter primary text idealnya.",
  iklan_google: "Iklan Google Ads: 3 headline pendek (max 30 karakter masing-masing) + 2 deskripsi (max 90 karakter). Format: 'Headline 1 | Headline 2 | Headline 3' lalu deskripsi.",
  headline: "Hanya headline / judul iklan: 5-10 alternatif headline kuat, masing-masing 1 baris, gaya copywriting (curiosity, benefit, urgency, fear).",
  artikel_blog: "Artikel blog SEO: struktur lengkap dengan judul (H1), pembuka, sub-heading (H2), 3-5 poin pembahasan, kesimpulan + CTA. Gunakan format markdown.",
  artikel_press: "Press release / siaran pers: gaya formal jurnalistik, lead paragraf 5W1H, body fakta-fakta, quote dari pihak sekolah/perusahaan, kontak di akhir.",
  email_marketing: "Email marketing: subject line menarik (di baris pertama 'Subject: ...'), salam pembuka, body singkat-jelas dengan benefit, CTA tombol, signature.",
  whatsapp_broadcast: "Pesan WhatsApp broadcast: salam ramah, isi singkat dengan bullet (•), CTA berupa link/nomor, hindari kesan spam.",
  script_video: "Script video pendek (Reels/TikTok 30-60 detik): scene-by-scene, ada [HOOK 0-3 detik], [PROBLEM], [SOLUTION], [PROOF], [CTA]. Sertakan saran visual & voice-over.",
  testimoni: "Testimoni / review pelanggan: format storytelling dari sudut pandang user (kepala sekolah/wali murid), problem sebelum pakai → setelah pakai → hasil konkret.",
  faq: "Daftar FAQ: 5-7 pertanyaan-jawaban yang sering ditanyakan calon pengguna. Format Q: ... A: ...",
  thread_twitter: "Thread Twitter/X: 5-8 tweet bernomor (1/8, 2/8, dst), tiap tweet max 280 karakter, hook di tweet 1.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY tidak tersedia" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json();
    const mode = raw.mode || "generate";
    const variants = Math.min(Math.max(raw.variants || 1, 1), 5);

    let sys = "";
    let user = "";

    if (mode === "rewrite") {
      const b = raw as RewriteBody;
      if (!b.source_text?.trim() && b.rewrite_style !== "mimic") {
        return new Response(JSON.stringify({ success: false, error: "Teks sumber wajib diisi" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (b.rewrite_style === "mimic" && !b.reference_text?.trim()) {
        return new Response(JSON.stringify({ success: false, error: "Teks referensi (contoh dari orang lain) wajib diisi untuk mode Tiru Gaya" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const styleGuide = REWRITE_STYLE_GUIDE[b.rewrite_style] || REWRITE_STYLE_GUIDE.improve;

      sys = `Kamu adalah copywriter & editor profesional. Tugasmu: REWRITE / parafrase teks untuk produk ATSkolla.

KONTEKS PRODUK (jangan tambah klaim fitur di luar konteks ini):
${PRODUCT_CONTEXT}

ATURAN REWRITE:
- ${styleGuide}
${b.rewrite_style === "custom" && b.custom_instruction ? `- Instruksi tambahan dari user: ${b.custom_instruction}` : ""}
${b.rewrite_style === "mimic" ? `- WAJIB ikuti POLA berikut dari teks referensi: panjang & jumlah paragraf, struktur (hook/body/CTA), gaya kalimat (panjang/pendek), penggunaan emoji & simbol, posisi hashtag, nada bicara, level formalitas, pemakaian bullet/list, gaya CTA.
- Ganti SEMUA referensi produk/brand di teks referensi menjadi ATSkolla beserta fitur ATSkolla yang relevan.
- Jangan menyalin kata demi kata — buat seolah-olah penulis yang sama menulis ulang untuk produk ATSkolla.` : "- Pertahankan informasi faktual yang sudah ada di teks asli."}
- Jangan menambahkan fitur produk yang tidak ada di konteks.
- Output HANYA teks hasil rewrite, tanpa pengantar seperti "Berikut hasil rewrite:".
${b.platform ? `- Format output disesuaikan untuk platform: ${b.platform}.` : ""}

${variants > 1 ? `Hasilkan ${variants} versi rewrite berbeda. Pisahkan setiap versi dengan baris "---VARIAN-{nomor}---" di awal.` : "Hasilkan 1 versi rewrite saja, langsung tanpa header."}`;

      if (b.rewrite_style === "mimic") {
        user = `TEKS REFERENSI (contoh gaya orang lain yang ingin ditiru):\n"""\n${b.reference_text}\n"""\n\n${b.source_text?.trim() ? `Topik / poin yang ingin disampaikan untuk ATSkolla:\n"""\n${b.source_text}\n"""` : `Topik: promosi umum ATSkolla (sesuaikan otomatis dengan tema teks referensi).`}\n\nTulis ulang dengan gaya & struktur PERSIS seperti teks referensi, tetapi isi tentang ATSkolla.`;
      } else {
        user = `Teks asli:\n"""\n${b.source_text}\n"""\n\nLakukan rewrite sesuai aturan di atas.`;
      }
    } else {
      const b = raw as GenerateBody;
      const lengthGuide = {
        pendek: "70-120 kata",
        sedang: "150-250 kata",
        panjang: "300-450 kata",
      }[b.length];

      const platformGuide: Record<string, string> = {
        facebook: "Format Facebook: paragraf naratif yang engaging, gunakan baris kosong untuk readability, boleh emoji secukupnya, akhiri dengan CTA yang kuat. Hindari hashtag berlebihan (max 5).",
        instagram: "Format Instagram: hook kuat di kalimat pertama, gunakan baris pendek, emoji aktif, akhiri dengan 15-20 hashtag relevan di bawah.",
        tiktok: "Format TikTok caption: sangat singkat, hook agresif, 1-2 kalimat punchy, hashtag viral di akhir.",
        twitter: "Format Twitter/X: maksimal 280 karakter per tweet, padat, langsung ke poin.",
        whatsapp: "Format WhatsApp broadcast: salam pembuka ramah, bullet point jelas (pakai • atau ✓), CTA berupa link/nomor WA.",
        linkedin: "Format LinkedIn: profesional, fokus pada value bisnis & data/manfaat, paragraf rapi, akhiri dengan pertanyaan diskusi.",
        blog: "Format Blog/Artikel: paragraf terstruktur dengan heading, intro-isi-penutup yang jelas, SEO-friendly.",
      };

      const ct = b.content_type || "caption_sosmed";
      const contentTypeGuide = CONTENT_TYPE_GUIDE[ct] || CONTENT_TYPE_GUIDE.caption_sosmed;

      sys = `Kamu adalah copywriter marketing senior khusus produk SaaS pendidikan Indonesia. Tugasmu: membuat konten promosi yang konversi tinggi untuk produk ATSkolla.

KONTEKS PRODUK:
${PRODUCT_CONTEXT}

JENIS KONTEN: ${ct.toUpperCase().replace(/_/g, " ")}
PEDOMAN JENIS KONTEN: ${contentTypeGuide}

ATURAN OUTPUT:
- Bahasa Indonesia natural, mudah dipahami audiens guru/kepala sekolah/yayasan.
- Tidak boleh berbohong atau menyebut fitur yang tidak ada di konteks produk.
- Selalu sebut nama brand "ATSkolla" minimal 1x.
- Tone: ${b.tone}.
- Panjang: ${lengthGuide}.
- ${b.emoji === false ? "JANGAN gunakan emoji." : "Gunakan emoji secukupnya untuk memperkuat pesan."}
- ${b.hashtags === false ? "JANGAN sertakan hashtag." : "Sertakan hashtag relevan di akhir jika sesuai."}
- Platform target: ${b.platform.toUpperCase()}. ${platformGuide[b.platform]}
${b.audience ? `- Target audiens: ${b.audience}.` : ""}
${b.cta ? `- CTA wajib: ${b.cta}` : "- Akhiri dengan CTA yang relevan (chat WA, daftar gratis, kunjungi website)."}

Hasilkan ${variants} varian berbeda. Pisahkan setiap varian dengan baris "---VARIAN-{nomor}---" di awal.`;

      user = `Buatkan ${variants} varian ${ct.replace(/_/g, " ")} untuk platform ${b.platform} tentang topik: "${b.topic}"`;
    }

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
