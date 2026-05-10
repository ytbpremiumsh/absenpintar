import { Link } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Zap, ShieldCheck, Sparkles, ScanLine, MessageCircle, BarChart3, Clock, Users } from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";
import heroDashboard from "@/assets/hero-dashboard.png";
import dashboardSchool from "@/assets/dashboard-school.jpg";
import dashboardTeacher from "@/assets/dashboard-teacher.jpg";
import dashboardParent from "@/assets/dashboard-parent.jpg";
import dashboardBendahara from "@/assets/dashboard-bendahara.jpg";
import illustScan from "@/assets/illustration-scan.png";
import illustMonitor from "@/assets/illustration-monitor.png";
import illustRegister from "@/assets/illustration-register.png";
import { CountdownBar, PromoFooter, StickyMobileCTA, TrustBar, buildRegisterUrl, useUtmCapture } from "@/components/promo/PromoShared";

export default function PromoTrial() {
  useUtmCapture();

  useEffect(() => {
    document.title = "Coba Gratis 14 Hari — ATSkolla Premium | Tanpa Kartu Kredit";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Aktifkan Premium ATSkolla GRATIS 14 hari. Absensi QR/Wajah, monitoring real-time, WhatsApp otomatis. Daftar 5 menit, tanpa kartu kredit.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  const ctaUrl = buildRegisterUrl("promo-trial");

  return (
    <div className="min-h-screen bg-background font-['Inter',sans-serif] pb-24 md:pb-0">
      <CountdownBar hours={23} label="Trial GRATIS 14 hari berakhir dalam" />

      {/* Top nav */}
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
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-[#5B6CF9]/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5 border border-amber-200 dark:border-amber-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              PROMO TERBATAS — TRIAL PREMIUM 14 HARI
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              Hemat <span className="text-[#5B6CF9]">3 jam/hari</span> urus absensi sekolah, mulai hari ini.
            </h1>
            <p className="text-lg text-muted-foreground mb-7 max-w-xl">
              Coba <span className="font-semibold text-foreground">semua fitur Premium GRATIS 14 hari</span> — Absensi QR & Wajah, Monitoring Real-Time, Notifikasi WhatsApp Otomatis ke Orang Tua, Laporan Bulanan, dan banyak lagi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                to={ctaUrl}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white font-bold px-7 py-4 rounded-xl shadow-xl shadow-[#5B6CF9]/30 hover:shadow-2xl hover:scale-[1.02] transition-all text-base"
              >
                Aktifkan Trial Gratis 14 Hari
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/fitur"
                className="inline-flex items-center justify-center gap-2 bg-secondary text-foreground font-semibold px-6 py-4 rounded-xl hover:bg-secondary/80 transition border border-border"
              >
                Lihat Demo Fitur
              </Link>
            </div>

            <TrustBar />
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B6CF9]/30 to-purple-500/20 rounded-3xl blur-2xl scale-95" />
            <img src={heroDashboard} alt="Dashboard ATSkolla" className="relative rounded-2xl shadow-2xl border border-border/40 w-full" loading="eager" />
          </div>
        </div>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section className="px-4 md:px-8 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Masalah yang Setiap Hari Bikin Pusing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">Ribuan sekolah Indonesia masih hadapi masalah absensi yang sama. ATSkolla selesaikan semuanya dalam 5 menit.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { bad: "Absensi manual makan waktu 30 menit/hari", good: "Scan QR/Wajah selesai 3 detik per siswa", icon: Clock },
              { bad: "Orang tua telat tahu anak tidak masuk", good: "Notifikasi WhatsApp otomatis saat siswa absen", icon: MessageCircle },
              { bad: "Rekap bulanan ribet di Excel", good: "Laporan otomatis siap export PDF/Excel", icon: BarChart3 },
            ].map((p, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/60 hover:border-[#5B6CF9]/40 hover:shadow-lg transition">
                <div className="w-12 h-12 rounded-xl bg-[#5B6CF9]/10 flex items-center justify-center mb-4">
                  <p.icon className="h-6 w-6 text-[#5B6CF9]" />
                </div>
                <div className="text-sm text-rose-600 dark:text-rose-400 line-through mb-2 opacity-70">{p.bad}</div>
                <div className="font-bold text-foreground leading-snug">{p.good}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES with screenshots */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Yang Anda Dapat Selama Trial</h2>
          <p className="text-center text-muted-foreground mb-12">Semua fitur Premium aktif penuh — tanpa batas, tanpa watermark.</p>

          <div className="space-y-16">
            {[
              {
                img: dashboardSchool,
                badge: "Untuk Sekolah",
                title: "Dashboard Sekolah Lengkap",
                desc: "Pantau kehadiran semua kelas dalam satu layar. Statistik real-time, grafik kehadiran harian/bulanan, dan akses cepat ke seluruh modul sekolah.",
                points: ["Statistik kehadiran real-time", "Multi-kelas multi-jenjang", "Export laporan PDF & Excel"],
              },
              {
                img: dashboardTeacher,
                badge: "Untuk Guru & Wali Kelas",
                title: "Wali Kelas Bisa Pantau Kelas Sendiri",
                desc: "Setiap wali kelas punya dashboard khusus. Lihat siswa kelasnya saja, kirim absensi manual, dan akses leaderboard kelas terbaik.",
                points: ["Absensi manual jika QR error", "Direktori siswa per kelas", "Leaderboard kompetisi antar kelas"],
              },
              {
                img: dashboardParent,
                badge: "Untuk Orang Tua",
                title: "Orang Tua Akses via WhatsApp & Web",
                desc: "Notifikasi langsung ke WhatsApp orang tua saat anak hadir, terlambat, atau tidak masuk. Pengajuan izin/sakit langsung dari HP.",
                points: ["Notifikasi WA otomatis", "Pengajuan izin/sakit online", "Riwayat kehadiran anak"],
              },
              {
                img: dashboardBendahara,
                badge: "Bonus: Modul Bendahara SPP",
                title: "Kelola SPP & Pembayaran Tanpa Ribet",
                desc: "Generate tagihan SPP massal, terima pembayaran online, dan kirim invoice ke orang tua via WhatsApp. Cocok untuk sekolah swasta.",
                points: ["Generate tagihan massal", "Pembayaran online (Mayar)", "Invoice PDF otomatis"],
              },
            ].map((f, i) => (
              <div key={i} className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#5B6CF9] bg-[#5B6CF9]/10 px-3 py-1 rounded-full mb-3">
                    {f.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground mb-5 leading-relaxed">{f.desc}</p>
                  <ul className="space-y-2.5">
                    {f.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-border/40 bg-card">
                    <img src={f.img} alt={f.title} className="w-full" loading="lazy" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-br from-[#5B6CF9]/5 via-background to-purple-500/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">Aktif dalam 5 Menit</h2>
          <p className="text-center text-muted-foreground mb-12">Tidak perlu install. Tidak perlu training berhari-hari.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: illustRegister, n: "1", t: "Daftar Sekolah", d: "Isi nama sekolah, NPSN, email admin. Trial Premium 14 hari aktif otomatis." },
              { img: illustScan, n: "2", t: "Tambah Siswa & Kelas", d: "Import dari Excel atau tambah manual. Generate kartu QR untuk setiap siswa." },
              { img: illustMonitor, n: "3", t: "Mulai Absensi", d: "Siswa scan QR/wajah saat datang. Orang tua otomatis terima notifikasi WhatsApp." },
            ].map((s) => (
              <div key={s.n} className="relative bg-card rounded-2xl p-7 border border-border/60 hover:shadow-xl transition">
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white font-extrabold flex items-center justify-center shadow-lg">
                  {s.n}
                </div>
                <img src={s.img} alt={s.t} className="h-32 mx-auto mb-4 object-contain" loading="lazy" />
                <h3 className="font-extrabold text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Apa Kata Sekolah yang Sudah Pakai</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Bu Siti, Kepala Sekolah", school: "SDN 3 Bandung", q: "Awalnya kami pakai absensi manual, sekarang guru bisa fokus mengajar. Orang tua juga senang karena dapat notifikasi WA langsung." },
              { name: "Pak Anwar, TU", school: "SMP Al-Hidayah", q: "Setup-nya cepat sekali, 1 hari sudah bisa dipakai semua kelas. Tim ATSkolla responsif dibantu via WhatsApp." },
              { name: "Bu Rina, Wali Kelas", school: "SD Cendekia", q: "Saya bisa pantau anak-anak kelas saya tanpa harus tanya TU. Laporan bulanan tinggal export PDF, hemat banyak waktu." },
            ].map((t, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/60 hover:border-[#5B6CF9]/40 transition">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-lg">★</span>
                  ))}
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

      {/* GUARANTEE */}
      <section className="px-4 md:px-8 py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Tanpa Risiko, Tanpa Komitmen</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Trial 14 hari penuh. Tidak perlu kartu kredit. Tidak ada penagihan otomatis. Setelah trial selesai, akun otomatis turun ke Free Plan — data Anda tetap aman.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-sm">
            {[
              { i: Zap, t: "Aktif 5 menit" },
              { i: ShieldCheck, t: "Tanpa kartu kredit" },
              { i: Users, t: "Support gratis" },
            ].map((b, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border/60">
                <b.i className="h-6 w-6 mx-auto mb-2 text-[#5B6CF9]" />
                <div className="font-semibold text-xs">{b.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 md:px-8 py-20 bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
            Mulai Trial Gratis 14 Hari Sekarang
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Bergabung dengan 500+ sekolah Indonesia yang sudah modernisasi absensi mereka.
          </p>
          <Link
            to={ctaUrl}
            className="inline-flex items-center gap-2 bg-white text-[#5B6CF9] font-extrabold px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all text-lg"
          >
            Daftar Gratis Sekarang
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="text-xs text-white/70 mt-5">Tidak perlu kartu kredit • Aktif dalam 5 menit • Batalkan kapan saja</div>
        </div>
      </section>

      <PromoFooter />
      <StickyMobileCTA to={ctaUrl} label="Aktifkan Trial Gratis 14 Hari" />
    </div>
  );
}
