import { Link } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Crown, ShieldCheck, Sparkles, MessageCircle, BarChart3, Database, Rocket, Star, X } from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";
import heroMockup from "@/assets/hero-mockup-theme2.png";
import dashboardStack from "@/assets/dashboard-preview-stack.png";
import dashboardSchool from "@/assets/dashboard-school.jpg";
import dashboardTeacher from "@/assets/dashboard-teacher.jpg";
import dashboardParent from "@/assets/dashboard-parent.jpg";
import dashboardBendahara from "@/assets/dashboard-bendahara.jpg";
import waHeader from "@/assets/atskolla-wa-header.png";
import idcard1 from "@/assets/idcard-design-1.png";
import idcard2 from "@/assets/idcard-design-2.png";
import idcard3 from "@/assets/idcard-design-3.png";
import { CountdownBar, PromoFooter, StickyMobileCTA, TrustBar, buildRegisterUrl, useUtmCapture } from "@/components/promo/PromoShared";

export default function PromoPremium() {
  useUtmCapture();

  useEffect(() => {
    document.title = "Upgrade Premium ATSkolla — Semua Fitur, Tanpa Batas Siswa";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Premium ATSkolla: kapasitas siswa unlimited, WA notifikasi otomatis, modul Bendahara SPP, ID Card cetak, custom domain. Mulai dari Rp 199rb/bulan.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  const ctaUrl = buildRegisterUrl("promo-premium");

  return (
    <div className="min-h-screen bg-background font-['Inter',sans-serif] pb-24 md:pb-0">
      <CountdownBar hours={47} label="Diskon Premium berakhir dalam" />

      <header className="px-4 md:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={atskollaLogo} alt="ATSkolla" className="h-9 w-9 object-contain" />
          <span className="font-extrabold text-lg tracking-tight">ATSkolla</span>
        </Link>
        <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Masuk</Link>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 md:px-8 pt-6 pb-16 md:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-400/15 to-rose-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#5B6CF9]/15 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold mb-5 shadow-lg shadow-amber-500/30">
              <Crown className="h-3.5 w-3.5" />
              PAKET PREMIUM — SEMUA FITUR TERBUKA
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              Sistem Absensi <span className="text-[#5B6CF9]">Premium</span>, harga sekolah Indonesia.
            </h1>
            <p className="text-lg text-muted-foreground mb-7 max-w-xl">
              Siswa unlimited, WA notifikasi otomatis ke orang tua, modul Bendahara SPP, ID Card cetak, custom domain sekolah — semua dalam satu platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                to={ctaUrl}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white font-bold px-7 py-4 rounded-xl shadow-xl shadow-[#5B6CF9]/30 hover:shadow-2xl hover:scale-[1.02] transition-all text-base"
              >
                Mulai Trial 14 Hari Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#harga"
                className="inline-flex items-center justify-center gap-2 bg-secondary text-foreground font-semibold px-6 py-4 rounded-xl hover:bg-secondary/80 transition border border-border"
              >
                Lihat Harga Premium
              </a>
            </div>

            <TrustBar />
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-[#5B6CF9]/20 rounded-3xl blur-2xl scale-95" />
            <img src={heroMockup} alt="Premium ATSkolla" className="relative rounded-2xl shadow-2xl border border-border/40 w-full" loading="eager" />
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="px-4 md:px-8 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Free vs Premium</h2>
          <p className="text-center text-muted-foreground mb-10">Lihat kenapa 78% sekolah memilih Premium dalam 14 hari pertama trial.</p>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-7 border-2 border-border/60">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">FREE</div>
              <div className="text-3xl font-extrabold mb-1">Rp 0</div>
              <div className="text-sm text-muted-foreground mb-6">Cocok untuk uji coba kecil</div>
              <ul className="space-y-3 text-sm">
                {[
                  { ok: true, t: "Maks 50 siswa" },
                  { ok: true, t: "Absensi QR dasar" },
                  { ok: false, t: "Notifikasi WhatsApp otomatis" },
                  { ok: false, t: "Modul Bendahara SPP" },
                  { ok: false, t: "ID Card siswa" },
                  { ok: false, t: "Custom domain sekolah" },
                  { ok: false, t: "Laporan PDF/Excel" },
                ].map((x, i) => (
                  <li key={i} className={`flex items-center gap-2.5 ${!x.ok && "text-muted-foreground line-through opacity-60"}`}>
                    {x.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-rose-400 shrink-0" />}
                    <span>{x.t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white rounded-2xl p-7 shadow-2xl shadow-[#5B6CF9]/30 scale-[1.02]">
              <div className="absolute -top-3 right-5 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Direkomendasikan
              </div>
              <div className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" /> PREMIUM
              </div>
              <div className="text-3xl font-extrabold mb-1">Rp 199rb<span className="text-base font-normal text-white/80">/bulan</span></div>
              <div className="text-sm text-white/80 mb-6">Untuk sekolah serius</div>
              <ul className="space-y-3 text-sm">
                {[
                  "Siswa UNLIMITED",
                  "Absensi QR + Wajah + Manual",
                  "WhatsApp otomatis ke orang tua",
                  "Modul Bendahara SPP lengkap",
                  "ID Card siswa siap cetak",
                  "Custom domain sekolah",
                  "Laporan PDF/Excel + Analytics",
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link to={ctaUrl} className="mt-6 block text-center bg-white text-[#5B6CF9] font-extrabold py-3 rounded-xl hover:scale-[1.02] transition shadow-lg">
                Coba Premium Gratis 14 Hari
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM FEATURES SHOWCASE */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Fitur Eksklusif Premium</h2>
          <p className="text-center text-muted-foreground mb-12">Hal-hal yang hanya bisa Anda lakukan dengan paket Premium.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: MessageCircle, img: waHeader, t: "WhatsApp Otomatis", d: "Setiap siswa hadir/terlambat/absen → orang tua langsung dapat notifikasi WA. Termasuk pesan ulang tahun & pengumuman." },
              { icon: Database, img: dashboardBendahara, t: "Modul Bendahara SPP", d: "Generate tagihan SPP massal, terima pembayaran online, kirim invoice via WA. Lengkap dengan rekap keuangan." },
              { icon: BarChart3, img: dashboardSchool, t: "Analytics Mendalam", d: "Tren kehadiran per kelas, leaderboard antar kelas, analisa absensi mingguan/bulanan, export PDF/Excel." },
              { icon: Sparkles, img: dashboardTeacher, t: "Wali Kelas Workspace", d: "Setiap wali kelas punya dashboard sendiri. Bisa absen manual, lihat siswa kelasnya, dan akses leaderboard." },
              { icon: Crown, img: dashboardParent, t: "Portal Orang Tua", d: "Orang tua login lihat riwayat anak, ajukan izin/sakit online, terima notifikasi langsung di HP." },
              { icon: Rocket, img: dashboardStack, t: "Multi-Role & Multi-Device", d: "Super Admin, Sekolah, Guru, Wali Kelas, Bendahara, Orang Tua — masing-masing punya akses sendiri." },
            ].map((f, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-[#5B6CF9]/40 hover:shadow-xl transition">
                <div className="h-40 bg-gradient-to-br from-[#5B6CF9]/10 to-purple-500/10 overflow-hidden flex items-center justify-center p-4">
                  <img src={f.img} alt={f.t} className="max-h-full max-w-full object-contain group-hover:scale-105 transition" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#5B6CF9]/10 flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-[#5B6CF9]" />
                  </div>
                  <h3 className="font-extrabold mb-1.5">{f.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ID CARD SHOWCASE */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-br from-[#5B6CF9]/5 via-background to-amber-500/5">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#5B6CF9] bg-[#5B6CF9]/10 px-3 py-1 rounded-full mb-3">
            Add-On Eksklusif
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Cetak ID Card Siswa Profesional</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">3 desain siap pakai dengan QR code unik per siswa. Cetak sendiri atau pesan jadi lewat ATSkolla.</p>
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[idcard1, idcard2, idcard3].map((src, i) => (
              <div key={i} className="bg-card rounded-2xl p-3 border border-border/60 hover:scale-105 hover:shadow-xl transition">
                <img src={src} alt={`Desain ID Card ${i + 1}`} className="w-full rounded-lg" loading="lazy" />
                <div className="text-xs font-semibold mt-2 text-muted-foreground">Desain {i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="harga" className="px-4 md:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Harga Transparan, Tanpa Biaya Tersembunyi</h2>
          <p className="text-center text-muted-foreground mb-12">Semua paket sudah termasuk update gratis selamanya & support via WhatsApp.</p>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "School", price: "99", desc: "Sekolah kecil hingga menengah", features: ["Maks 300 siswa", "WA notifikasi otomatis", "Laporan lengkap", "Multi wali kelas", "Support email"] },
              { name: "Premium", price: "199", popular: true, desc: "Pilihan terbaik sekolah Indonesia", features: ["Siswa UNLIMITED", "Semua fitur School", "Modul Bendahara SPP", "ID Card siswa", "Custom domain", "Priority support WA"] },
              { name: "Enterprise", price: "Custom", desc: "Yayasan & multi-cabang", features: ["Multi-sekolah / cabang", "Semua fitur Premium", "Dedicated manager", "Training onsite", "API & integrasi"] },
            ].map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-7 transition ${p.popular ? "bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white shadow-2xl shadow-[#5B6CF9]/30 scale-[1.03]" : "bg-card border border-border/60 hover:border-[#5B6CF9]/40 hover:shadow-lg"}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Paling Laris
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${p.popular ? "text-white/80" : "text-muted-foreground"}`}>{p.name}</div>
                <div className="mb-1">
                  {p.price === "Custom" ? (
                    <div className="text-3xl font-extrabold">Custom</div>
                  ) : (
                    <div className="text-3xl font-extrabold">Rp {p.price}rb<span className={`text-base font-normal ${p.popular ? "text-white/80" : "text-muted-foreground"}`}>/bulan</span></div>
                  )}
                </div>
                <div className={`text-sm mb-5 ${p.popular ? "text-white/80" : "text-muted-foreground"}`}>{p.desc}</div>
                <ul className="space-y-2.5 text-sm mb-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${p.popular ? "text-amber-300" : "text-emerald-500"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaUrl}
                  className={`block text-center font-extrabold py-3 rounded-xl transition ${p.popular ? "bg-white text-[#5B6CF9] hover:scale-[1.02] shadow-lg" : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"}`}
                >
                  {p.price === "Custom" ? "Hubungi Kami" : "Mulai Trial Gratis"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 md:px-8 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Sudah Dipercaya Sekolah Seluruh Indonesia</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { name: "Pak Budi, Kepala Sekolah", school: "MTs Nurul Iman, Jakarta", q: "Setelah pakai Premium, orang tua jauh lebih tenang. Modul Bendahara SPP juga bantu kami atur keuangan tanpa Excel ribet." },
              { name: "Bu Ayu, Yayasan", school: "Yayasan Cahaya Pendidikan", q: "Kami punya 3 cabang sekolah. ATSkolla Premium kasih kami gambaran utuh, dan harganya jauh lebih terjangkau dibanding kompetitor." },
            ].map((t, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/60">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-foreground/90">"{t.q}"</p>
                <div className="border-t border-border/60 pt-3">
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.school}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Pertanyaan yang Sering Ditanya</h2>
          <div className="space-y-3">
            {[
              { q: "Apakah ada kontrak jangka panjang?", a: "Tidak. Anda bisa berhenti kapan saja. Bayar bulanan, tanpa komitmen." },
              { q: "Bagaimana cara pembayarannya?", a: "Pembayaran lewat Mayar — Transfer Bank, e-Wallet (OVO, GoPay, DANA), atau QRIS. Otomatis aktif setelah bayar." },
              { q: "Data sekolah saya aman?", a: "Sangat aman. Data dienkripsi, backup harian, dan disimpan di server cloud terpercaya. Hanya admin sekolah yang bisa akses data sekolahnya." },
              { q: "Apakah bisa migrasi dari sistem lain?", a: "Bisa. Tim kami akan bantu import data siswa dari Excel/CSV. Gratis untuk paket Premium dan Enterprise." },
              { q: "Berapa lama trial 14 hari?", a: "14 hari penuh dengan semua fitur Premium aktif. Tidak perlu kartu kredit. Setelah trial selesai, akun otomatis turun ke Free Plan." },
            ].map((f, i) => (
              <details key={i} className="group bg-card border border-border/60 rounded-xl p-5 hover:border-[#5B6CF9]/40 transition">
                <summary className="font-bold cursor-pointer flex justify-between items-center list-none">
                  {f.q}
                  <span className="text-[#5B6CF9] group-open:rotate-45 transition text-2xl leading-none">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 md:px-8 py-20 bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-amber-300" />
          <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
            Naikkan Standar Sekolah Anda Hari Ini
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Coba Premium gratis 14 hari. Rasakan sendiri kenapa 78% sekolah memilih Premium.
          </p>
          <Link
            to={ctaUrl}
            className="inline-flex items-center gap-2 bg-white text-[#5B6CF9] font-extrabold px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all text-lg"
          >
            Mulai Trial Premium Gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="flex items-center justify-center gap-2 mt-5 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" />
            Tanpa kartu kredit • Aktif 5 menit • Berhenti kapan saja
          </div>
        </div>
      </section>

      <PromoFooter />
      <StickyMobileCTA to={ctaUrl} label="Mulai Trial Premium Gratis" />
    </div>
  );
}
