import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ScanLine, Monitor, MessageSquare, FileBarChart,
  ArrowRight, ArrowDown, CheckCircle2, School, Mail, Phone, MapPin,
  Shield, Zap, HeadphonesIcon, BarChart3, Smartphone, Layout,
  Lock, Star, TrendingUp, Sparkles, ChevronRight, Globe, Bell, Clock, Settings, FileText, QrCode, Users, GraduationCap,
  AlertTriangle, XCircle, Lightbulb, UserCheck, Camera,
} from "lucide-react";

const iconMap: Record<string, any> = {
  scan: ScanLine,
  monitor: Monitor,
  message: MessageSquare,
  chart: FileBarChart,
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const STATS = [
  { value: "< 1 detik", label: "Waktu Scan Barcode" },
  { value: "AI", label: "Face Recognition" },
  { value: "100%", label: "Data Terenkripsi" },
  { value: "∞", label: "Riwayat Tersimpan" },
];

const WHY_ITEMS_FALLBACK = [
  { icon: Lock, title: "Keamanan Terjamin", desc: "Setiap absensi melalui verifikasi barcode atau face recognition. Data terenkripsi dan tersimpan aman." },
  { icon: Smartphone, title: "Multi-Platform", desc: "Akses dari perangkat apa saja tanpa perlu install aplikasi. Responsive di semua ukuran layar." },
  { icon: TrendingUp, title: "Skalabel & Fleksibel", desc: "Dari 30 siswa hingga ribuan siswa. Tumbuh bersama sekolah Anda." },
  { icon: Star, title: "Mudah Digunakan", desc: "Setup hanya beberapa menit — import data, aktifkan scan, langsung pakai." },
];

const PROBLEMS = [
  { icon: AlertTriangle, title: "Absensi Manual", desc: "Pencatatan kehadiran masih menggunakan buku tulis, rawan kesalahan dan manipulasi data." },
  { icon: XCircle, title: "Tidak Ada Rekap Digital", desc: "Sekolah kesulitan membuat laporan kehadiran bulanan karena data tidak terdigitalisasi." },
  { icon: Clock, title: "Proses Lambat", desc: "Guru harus memanggil satu per satu siswa untuk absensi, memakan waktu belajar." },
  { icon: Users, title: "Orang Tua Tidak Tahu", desc: "Wali murid tidak mendapat informasi real-time tentang kehadiran anaknya di sekolah." },
  { icon: FileText, title: "Laporan Tidak Akurat", desc: "Data absensi manual sulit diaudit dan sering terjadi ketidakcocokan data." },
  { icon: Globe, title: "Tidak Transparan", desc: "Tidak ada sistem monitoring kehadiran yang bisa diakses orang tua secara online." },
];

const SOLUTIONS_MAP = [
  { icon: QrCode, problem: "Absensi Manual", solution: "Scan Barcode Instan", desc: "Siswa cukup scan barcode untuk mencatat kehadiran. Proses kurang dari 1 detik." },
  { icon: UserCheck, problem: "Proses Lambat", solution: "Face Recognition AI", desc: "Siswa berdiri di depan kamera, AI mengenali wajah dan mencatat absensi otomatis." },
  { icon: BarChart3, problem: "Tidak Ada Rekap Digital", solution: "Rekap Otomatis", desc: "Rekap harian, mingguan, dan bulanan dibuat otomatis dengan statistik lengkap." },
  { icon: Monitor, problem: "Tidak Transparan", solution: "Dashboard Real-Time", desc: "Dashboard menampilkan statistik kehadiran secara live — hadir, izin, sakit, alfa." },
  { icon: Bell, problem: "Orang Tua Tidak Tahu", solution: "Notifikasi WhatsApp", desc: "Wali murid otomatis menerima notifikasi WhatsApp saat anak tercatat hadir." },
  { icon: FileBarChart, problem: "Laporan Tidak Akurat", solution: "Export Excel & PDF", desc: "Laporan kehadiran lengkap bisa di-export dalam format Excel atau PDF." },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("landing_content").select("key, value").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((item: any) => { map[item.key] = item.value; });
      setContent(map);
      setLoading(false);
    });
  }, []);

  const get = (key: string, fallback = "") => content[key] || fallback;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  const features = [
    { title: "Scan Barcode", desc: "Absensi instan dengan scan barcode. Siswa cukup menunjukkan kartu barcode untuk dicatat kehadirannya.", icon: ScanLine },
    { title: "Face Recognition", desc: "Absensi menggunakan pengenalan wajah berbasis AI. Tanpa kartu, tanpa sentuhan.", icon: UserCheck },
    { title: "Dashboard Real-Time", desc: "Pantau statistik kehadiran siswa secara real-time dengan grafik interaktif.", icon: Monitor },
    { title: "Rekap & Export", desc: "Rekap harian, mingguan, bulanan. Export laporan ke Excel atau PDF.", icon: FileBarChart },
    { title: "Notifikasi WhatsApp", desc: "Kirim notifikasi otomatis ke orang tua saat siswa tercatat hadir.", icon: Bell },
    { title: "Multi Sekolah", desc: "Arsitektur SaaS multi-tenant. Satu platform untuk banyak sekolah.", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {get("footer_logo") ? (
              <img src={get("footer_logo")} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-foreground text-sm">Smart School Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">Masuk</button>
            <button onClick={() => navigate("/register")} className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
              Daftar <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center relative px-4 text-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6 relative z-10">
          <span className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Sistem Absensi Digital #1 untuk Sekolah Indonesia
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] relative z-10">
          <span className="text-foreground">Smart School </span>
          <span className="text-primary">Attendance</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed relative z-10">
          Sistem absensi siswa modern dengan barcode scan dan face recognition. Dirancang khusus untuk sekolah Indonesia.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10 flex flex-col sm:flex-row gap-3 relative z-10">
          <button onClick={() => navigate("/register")} className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-semibold transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 text-sm">
            <Zap className="h-4 w-4" /> Mulai Gratis Sekarang
          </button>
          <a href="#features" className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-8 py-3.5 rounded-2xl font-semibold transition-all text-sm border border-border">
            Lihat Fitur <ArrowDown className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full max-w-3xl relative z-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-destructive mb-3 block">Latar Belakang</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Masalah Absensi di Sekolah</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Sistem absensi manual di sekolah Indonesia masih menyimpan banyak masalah dan ketidakefisienan.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {PROBLEMS.map((p, i) => (
              <motion.div key={p.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="group rounded-2xl p-6 transition-all duration-300 border bg-destructive/5 border-destructive/10 hover:border-destructive/20 hover:shadow-lg hover:shadow-destructive/5">
                <p.icon className="h-7 w-7 text-destructive mb-3" />
                <h3 className="font-bold text-foreground text-base mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col items-center mb-16">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-xl shadow-success/20">
              <ArrowDown className="h-6 w-6 text-success-foreground" />
            </div>
            <p className="mt-3 font-bold text-success text-base">Solusi Kami</p>
          </motion.div>

          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-success mb-3 block">Jawaban Tepat</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Smart School Attendance System</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Sistem absensi digital terintegrasi yang menyelesaikan setiap permasalahan dengan teknologi modern.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {SOLUTIONS_MAP.map((s, i) => (
              <motion.div key={s.solution} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="rounded-2xl p-6 transition-all duration-300 border bg-success/5 border-success/10 hover:border-success/20 hover:shadow-lg hover:shadow-success/5">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shrink-0 shadow-lg shadow-success/15">
                    <s.icon className="h-5 w-5 text-success-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{s.problem}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-success" />
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">{s.solution}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{s.solution}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 block">Fitur & Keunggulan</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Semua yang Sekolah Anda Butuhkan</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Solusi lengkap untuk mengelola absensi siswa dengan aman, cepat, dan terstruktur.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="group bg-card hover:bg-card/80 border border-border/50 hover:border-primary/20 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 block">Kenapa Harus Kami</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Solusi Lengkap untuk Absensi Siswa Digital
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Kami menyediakan solusi menyeluruh untuk membantu sekolah Anda mengelola absensi siswa dengan modern dan efisien.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {WHY_ITEMS_FALLBACK.map((item, i) => (
              <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="flex gap-4 sm:gap-5 items-start bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 block">Harga</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Paket Langganan</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Pilih paket yang sesuai dengan kebutuhan sekolah Anda.</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: "Basic", price: "Rp 99.000", features: ["Absensi barcode", "Manajemen siswa & kelas", "Dashboard statistik", "Rekap absensi", "Maks. 200 siswa"], highlighted: false },
              { name: "School", price: "Rp 199.000", features: ["Semua fitur Basic", "Unlimited siswa", "Rekap absensi lengkap", "Export laporan Excel", "Notifikasi WhatsApp"], highlighted: true },
              { name: "Premium", price: "Rp 399.000", features: ["Semua fitur School", "Face Recognition AI", "Multi cabang sekolah", "Custom logo sekolah", "Dukungan prioritas"], highlighted: false },
            ].map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <div className={`rounded-2xl p-6 sm:p-7 border transition-all h-full flex flex-col ${plan.highlighted ? "border-primary shadow-xl shadow-primary/10 bg-card ring-2 ring-primary" : "border-border/50 bg-card"}`}>
                  {plan.highlighted && <span className="text-xs font-bold text-primary mb-2 block">⭐ Rekomendasi</span>}
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-2xl font-extrabold text-primary mt-2">{plan.price}<span className="text-xs text-muted-foreground font-normal"> /bulan</span></p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate("/register")} className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlighted ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-foreground hover:bg-muted/80 border border-border"}`}>
                    Mulai Sekarang
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 block">Pembayaran Mudah</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Kanal Pembayaran</h2>
            <p className="mt-3 text-muted-foreground">Bebas pilih cara bayar! Semua metode populer tersedia.</p>
          </motion.div>
          <div className="space-y-8">
            {[
              { title: "E-Wallet", desc: "Pembayaran melalui e-wallet", img: "/images/payments/ewallet.webp", small: false },
              { title: "Transfer Bank", desc: "Pembayaran melalui transfer antar bank", img: "/images/payments/transfer-bank.webp", small: false },
              { title: "Gerai / Outlet", desc: "Pembayaran melalui gerai Alfamart atau Indomaret", img: "/images/payments/gerai.webp", small: true },
            ].map((category, ci) => (
              <motion.div key={ci} custom={ci} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-t border-border pt-5">
                <h4 className="font-bold text-foreground text-sm">{category.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{category.desc}</p>
                <img src={category.img} alt={category.title} className={category.small ? "h-8 sm:h-10 w-auto object-contain" : "max-w-full sm:max-w-2xl h-auto object-contain"} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Siap Tingkatkan Sistem Absensi Sekolah Anda?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-xl mx-auto">Bergabung sekarang dan rasakan kemudahan absensi digital. Setup hanya 5 menit.</p>
            <button onClick={() => navigate("/register")} className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 text-base">
              <Zap className="h-5 w-5" /> Daftar Gratis Sekarang
            </button>
            <p className="text-muted-foreground/50 text-xs mt-4">Tidak perlu kartu kredit • Setup instan • Batalkan kapan saja</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              {get("footer_logo") ? (
                <img src={get("footer_logo")} alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-md" />
              ) : (
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div>
                <p className="font-bold text-foreground text-sm">Smart School Attendance System</p>
                <p className="text-xs text-muted-foreground">Sistem Absensi Digital</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2 text-sm text-muted-foreground">
              {get("footer_address") && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {get("footer_address")}</span>}
              {get("footer_email") && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {get("footer_email")}</span>}
              {get("footer_phone") && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {get("footer_phone")}</span>}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Smart School Attendance System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
