import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Target, TrendingUp, Users, DollarSign,
  Shield, Layers, Rocket, BarChart3, Globe, Building2, Zap,
  CheckCircle2, AlertTriangle, Star, ChevronRight, Smartphone,
  QrCode, Bell, FileCheck, UserCheck, Wifi, PieChart, CreditCard,
  School, Heart, ShieldCheck, Clock, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
};

/* ══════════════════════════════════════════════════════════
   SECTION WRAPPER
   ══════════════════════════════════════════════════════════ */
const Section = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`py-12 sm:py-16 ${className}`}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div>
  </section>
);

const SectionTitle = ({ bab, title, icon: Icon }: { bab: string; title: string; icon: any }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
    className="mb-8 sm:mb-10">
    <div className="flex items-center gap-3 mb-2">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-bold text-primary uppercase tracking-widest">{bab}</span>
    </div>
    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
    <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary/40" />
  </motion.div>
);

/* ══════════════════════════════════════════════════════════
   SIDEBAR NAV
   ══════════════════════════════════════════════════════════ */
const NAV = [
  { id: "bab1", label: "BAB I – Pendahuluan" },
  { id: "bab2", label: "BAB II – Strategi Usaha" },
  { id: "bab3", label: "BAB III – Produk" },
  { id: "bab4", label: "BAB IV – Organisasi" },
  { id: "bab5", label: "BAB V – Keuangan" },
  { id: "bab6", label: "BAB VI – Kesimpulan" },
  { id: "bab7", label: "BAB VII – Daftar Pustaka" },
  { id: "bab8", label: "BAB VIII – Lampiran" },
];

/* ══════════════════════════════════════════════════════════
   BMC DATA
   ══════════════════════════════════════════════════════════ */
const BMC = {
  keyPartners: [
    "Sekolah & Yayasan Pendidikan",
    "Provider WhatsApp API (Fonnte)",
    "Hosting & Cloud (Supabase)",
    "Vendor Kartu Pelajar Digital",
    "Dinas Pendidikan Daerah",
  ],
  keyActivities: [
    "Pengembangan fitur platform SaaS",
    "Integrasi barcode & face recognition",
    "Pemasaran digital & direct selling",
    "Onboarding & pelatihan sekolah",
    "Maintenance & support teknis 24/7",
  ],
  keyResources: [
    "Tim developer full-stack",
    "Infrastruktur cloud scalable",
    "Database siswa & absensi",
    "Sistem AI face recognition",
    "Tim customer success",
  ],
  valueProposition: [
    "Absensi digital real-time via barcode & face AI",
    "Notifikasi otomatis ke wali murid via WhatsApp",
    "Dashboard monitoring kehadiran siswa",
    "Laporan & rekap otomatis (harian, mingguan, bulanan)",
    "Hemat waktu guru hingga 80%",
    "Meningkatkan keamanan & transparansi sekolah",
  ],
  customerRelationships: [
    "Onboarding & pelatihan gratis",
    "Live chat & ticket support",
    "Program referral & poin loyalitas",
    "Komunitas pengguna sekolah",
    "Update fitur berkala",
  ],
  channels: [
    "Website & landing page",
    "Media sosial (Instagram, TikTok)",
    "Kunjungan langsung ke sekolah",
    "WhatsApp marketing",
    "Webinar edukasi",
    "Program affiliate",
  ],
  customerSegments: [
    "SD/MI, SMP/MTs, SMA/MA/SMK",
    "Sekolah swasta & negeri",
    "Yayasan pendidikan multi-cabang",
    "Lembaga bimbingan belajar",
    "Pondok pesantren modern",
  ],
  costStructure: [
    "Biaya server & cloud infrastructure",
    "Gaji tim developer & support",
    "Biaya WhatsApp API per pesan",
    "Marketing & akuisisi pelanggan",
    "Biaya produksi kartu pelajar digital",
  ],
  revenueStreams: [
    "Langganan SaaS bulanan (Basic/School/Premium)",
    "Implementasi & customisasi enterprise",
    "Add-on layanan WhatsApp",
    "White-labeling untuk yayasan besar",
    "Penjualan kartu pelajar digital",
  ],
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
const Proposal = () => {
  const [activeNav, setActiveNav] = useState("bab1");

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <h1 className="text-sm font-bold text-foreground">Proposal Bisnis — ATSkolla</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-border p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Daftar Isi</p>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeNav === n.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          {/* COVER */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 sm:py-24">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08)_0%,transparent_50%)]" />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                  <BookOpen className="h-3.5 w-3.5" /> Proposal Rencana Bisnis
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
                  ATSkolla
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Smart Attendance & Pickup System — Sistem Absensi Digital Sekolah Berbasis Barcode & Face Recognition
                  dengan Notifikasi WhatsApp Real-time
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {["SaaS Platform", "Face AI", "WhatsApp API", "Real-time Dashboard"].map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* ════════════════ BAB I ════════════════ */}
          <Section id="bab1">
            <SectionTitle bab="BAB I" title="Pendahuluan" icon={BookOpen} />

            {/* 1.1 Latar Belakang */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.1</span> Latar Belakang
              </h3>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Pengelolaan kehadiran siswa di sekolah-sekolah Indonesia masih didominasi oleh metode manual — 
                  buku absensi, lembar kertas, dan tanda tangan. Proses ini tidak hanya memakan waktu 15-30 menit 
                  per kelas setiap hari, tetapi juga rentan terhadap manipulasi, kehilangan data, dan kesalahan rekap.
                </p>
                <p>
                  Di sisi lain, orang tua memiliki kekhawatiran tinggi terhadap keselamatan dan kehadiran anak mereka 
                  di sekolah. Menurut survei Kemendikbud 2024, lebih dari 72% wali murid menginginkan notifikasi 
                  real-time tentang status kehadiran anak di sekolah. Namun, mayoritas sekolah belum memiliki 
                  infrastruktur digital untuk mewujudkan hal tersebut.
                </p>
                <p>
                  <strong>ATSkolla</strong> hadir sebagai solusi komprehensif — platform SaaS yang mengintegrasikan 
                  teknologi barcode scanning, face recognition AI, notifikasi WhatsApp otomatis, dan dashboard 
                  real-time untuk mengubah cara sekolah mengelola absensi dari manual menjadi digital sepenuhnya.
                </p>
              </div>
            </motion.div>

            {/* 1.2 Deskripsi Usaha */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.2</span> Deskripsi Usaha
              </h3>
              <Card className="border-0 shadow-sm bg-card/50">
                <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">ATSkolla</strong> adalah platform Software-as-a-Service (SaaS) 
                    yang menyediakan sistem absensi digital, monitoring kehadiran real-time, dan notifikasi otomatis 
                    untuk sekolah-sekolah di Indonesia.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: "Sektor", value: "EdTech / Pendidikan Digital" },
                      { label: "Model", value: "SaaS Berlangganan (B2B)" },
                      { label: "Produk", value: "Platform Absensi & Pickup System" },
                      { label: "Target", value: "Sekolah SD, SMP, SMA/SMK, Pesantren" },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{item.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 1.3 Visi & Misi */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.3</span> Visi dan Misi Usaha
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-5 w-5 text-primary" />
                      <h4 className="font-bold text-foreground">Visi</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Menjadi platform absensi digital terdepan di Indonesia yang memberdayakan 
                      sekolah dengan teknologi cerdas, meningkatkan keamanan siswa, dan memberikan 
                      ketenangan bagi orang tua.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-accent/30 to-accent/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="h-5 w-5 text-primary" />
                      <h4 className="font-bold text-foreground">Misi</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {[
                        "Menyediakan sistem absensi digital yang mudah & terjangkau",
                        "Mengintegrasikan teknologi AI & barcode untuk akurasi maksimal",
                        "Membangun jembatan komunikasi real-time sekolah ↔ orang tua",
                        "Mendigitalisasi administrasi sekolah secara menyeluruh",
                      ].map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* 1.4 Analisis Pasar */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.4</span> Analisis Pasar
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Indonesia memiliki <strong className="text-foreground">436.000+ sekolah</strong> dengan 
                  <strong className="text-foreground"> 50 juta+ siswa</strong>. Mayoritas masih menggunakan 
                  sistem absensi manual. Ini merupakan peluang pasar yang sangat besar.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: School, value: "436K+", label: "Total Sekolah", color: "text-emerald-500" },
                    { icon: Users, value: "50M+", label: "Total Siswa", color: "text-amber-500" },
                    { icon: Globe, value: "34", label: "Provinsi", color: "text-cyan-500" },
                    { icon: TrendingUp, value: "85%", label: "Masih Manual", color: "text-rose-500" },
                  ].map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Karakteristik Target Pasar</h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { title: "Primer", desc: "Sekolah swasta dengan 200-1000 siswa yang memiliki anggaran digitalisasi" },
                        { title: "Sekunder", desc: "Sekolah negeri unggulan & pesantren modern yang ingin meningkatkan keamanan" },
                        { title: "Tersier", desc: "Yayasan pendidikan multi-cabang yang butuh monitoring terpusat" },
                      ].map((seg) => (
                        <div key={seg.title} className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs font-bold text-primary mb-1">{seg.title}</p>
                          <p className="text-xs text-muted-foreground">{seg.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* 1.5 Analisis Kompetitor */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}>
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.5</span> Analisis Kompetitor
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-bold text-foreground rounded-tl-lg">Fitur</th>
                      <th className="text-center p-3 font-bold text-primary">ATSkolla</th>
                      <th className="text-center p-3 font-bold text-muted-foreground">Kompetitor A</th>
                      <th className="text-center p-3 font-bold text-muted-foreground rounded-tr-lg">Kompetitor B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Scan Barcode", true, true, false],
                      ["Face Recognition AI", true, false, false],
                      ["Notifikasi WhatsApp", true, false, true],
                      ["Dashboard Real-time", true, true, true],
                      ["Multi-cabang / Grup", true, false, false],
                      ["Harga Terjangkau", true, false, true],
                      ["White-labeling", true, false, false],
                      ["Sistem Pickup", true, false, false],
                    ].map(([fitur, a, b, c], i) => (
                      <tr key={i} className="hover:bg-muted/20 transition">
                        <td className="p-3 text-muted-foreground">{fitur as string}</td>
                        <td className="p-3 text-center">{a ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-3 text-center">{b ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-3 text-center">{c ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Card className="border-0 shadow-sm mt-4">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-foreground mb-1">Unique Selling Point (USP)</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ATSkolla adalah satu-satunya platform yang menggabungkan <strong>barcode + face AI + WhatsApp API + 
                    pickup system</strong> dalam satu ekosistem terpadu, dengan harga yang dimulai dari Rp 99.000/bulan — 
                    menjadikannya solusi paling lengkap dan terjangkau di pasar EdTech Indonesia.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Section>

          {/* ════════════════ BAB II ════════════════ */}
          <Section id="bab2" className="bg-muted/20">
            <SectionTitle bab="BAB II" title="Strategi Usaha" icon={Target} />

            {/* 2.1 Model Bisnis - BMC */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">2.1</span> Model Bisnis — Business Model Canvas
              </h3>

              {/* BMC VISUAL */}
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px] grid grid-cols-10 grid-rows-[auto_auto_auto] gap-[2px] bg-border rounded-xl overflow-hidden text-[10px] sm:text-xs">
                  {/* Row 1 */}
                  <BmcBlock title="Key Partners" items={BMC.keyPartners} icon={Building2} className="col-span-2 row-span-2 bg-rose-50 dark:bg-rose-950/30" color="text-rose-600 dark:text-rose-400" />
                  <BmcBlock title="Key Activities" items={BMC.keyActivities} icon={Zap} className="col-span-2 bg-amber-50 dark:bg-amber-950/30" color="text-amber-600 dark:text-amber-400" />
                  <BmcBlock title="Value Propositions" items={BMC.valueProposition} icon={Heart} className="col-span-2 row-span-2 bg-primary/5" color="text-primary" />
                  <BmcBlock title="Customer Relationships" items={BMC.customerRelationships} icon={Users} className="col-span-2 bg-cyan-50 dark:bg-cyan-950/30" color="text-cyan-600 dark:text-cyan-400" />
                  <BmcBlock title="Customer Segments" items={BMC.customerSegments} icon={Target} className="col-span-2 row-span-2 bg-violet-50 dark:bg-violet-950/30" color="text-violet-600 dark:text-violet-400" />

                  {/* Row 2 */}
                  <BmcBlock title="Key Resources" items={BMC.keyResources} icon={Layers} className="col-span-2 bg-emerald-50 dark:bg-emerald-950/30" color="text-emerald-600 dark:text-emerald-400" />
                  <BmcBlock title="Channels" items={BMC.channels} icon={Globe} className="col-span-2 bg-indigo-50 dark:bg-indigo-950/30" color="text-indigo-600 dark:text-indigo-400" />

                  {/* Row 3 */}
                  <BmcBlock title="Cost Structure" items={BMC.costStructure} icon={DollarSign} className="col-span-5 bg-red-50 dark:bg-red-950/30" color="text-red-600 dark:text-red-400" />
                  <BmcBlock title="Revenue Streams" items={BMC.revenueStreams} icon={TrendingUp} className="col-span-5 bg-green-50 dark:bg-green-950/30" color="text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* BMC Narrative */}
              <div className="mt-6 space-y-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Cara Kerja BMC:</strong> Setiap elemen dalam canvas saling berkaitan 
                      membentuk ekosistem bisnis yang utuh. <em>Key Partners</em> (sekolah & provider API) menyediakan 
                      infrastruktur, <em>Key Activities</em> (pengembangan & pemasaran) menghasilkan <em>Value Proposition</em> 
                      berupa sistem absensi digital terpadu yang disampaikan melalui <em>Channels</em> (website, sosmed, kunjungan) 
                      kepada <em>Customer Segments</em> (sekolah di seluruh Indonesia).
                    </p>
                    <p>
                      <strong className="text-foreground">Revenue Streams:</strong> Pendapatan utama berasal dari langganan SaaS 
                      bulanan (3 tier: Basic Rp 99K, School Rp 249K, Premium Rp 399K), dilengkapi pendapatan tambahan dari 
                      enterprise customization, add-on WhatsApp, dan white-labeling.
                    </p>
                    <p>
                      <strong className="text-foreground">Cost Structure:</strong> Biaya operasional utama meliputi infrastruktur 
                      cloud (~20%), biaya WhatsApp API per pesan (~15%), gaji tim (~40%), dan marketing (~25%). 
                      Model SaaS memungkinkan margin kotor 60-70% setelah tahun pertama.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* 2.2 Rencana Pemasaran */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">2.2</span> Rencana Pemasaran
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Strategi Akuisisi",
                    icon: Target,
                    items: [
                      "Free trial 14 hari untuk semua sekolah baru",
                      "Demo langsung & kunjungan ke sekolah target",
                      "Webinar edukasi \"Digitalisasi Absensi\"",
                      "Kerjasama dengan Dinas Pendidikan daerah",
                    ],
                  },
                  {
                    title: "Branding & Promosi",
                    icon: Star,
                    items: [
                      "Konten edukasi di Instagram, TikTok, YouTube",
                      "Testimoni sekolah yang sudah menggunakan",
                      "Program referral: poin untuk setiap sekolah yang diajak",
                      "Affiliate program untuk individu & komunitas pendidikan",
                    ],
                  },
                ].map((strat) => (
                  <Card key={strat.title} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <strat.icon className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-foreground text-sm">{strat.title}</h4>
                      </div>
                      <ul className="space-y-2">
                        {strat.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </Section>

          {/* ════════════════ BAB III ════════════════ */}
          <Section id="bab3">
            <SectionTitle bab="BAB III" title="Produk atau Jasa" icon={Layers} />

            {/* 3.1 Deskripsi Produk */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.1</span> Deskripsi Produk
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: QrCode, title: "Scan Barcode", desc: "Absensi instan via scan barcode kartu pelajar — proses < 2 detik per siswa" },
                  { icon: UserCheck, title: "Face Recognition AI", desc: "Verifikasi identitas otomatis menggunakan teknologi pengenalan wajah" },
                  { icon: Bell, title: "Notifikasi WhatsApp", desc: "Wali murid menerima notifikasi otomatis saat anak hadir/pulang" },
                  { icon: BarChart3, title: "Dashboard Real-time", desc: "Monitoring kehadiran seluruh sekolah dalam satu tampilan" },
                  { icon: FileCheck, title: "Laporan Otomatis", desc: "Rekap harian, mingguan, bulanan — siap cetak atau export" },
                  { icon: Shield, title: "Sistem Pickup", desc: "Verifikasi penjemput siswa untuk keamanan pulang sekolah" },
                ].map((f, i) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <f.icon className="h-8 w-8 text-primary mb-3" />
                      <h4 className="text-sm font-bold text-foreground mb-1">{f.title}</h4>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* 3.2 Proses Layanan */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.2</span> Proses Pemberian Layanan
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { step: "1", title: "Registrasi", desc: "Sekolah mendaftar akun & input data siswa" },
                  { step: "2", title: "Setup", desc: "Generate barcode / setup face AI untuk tiap siswa" },
                  { step: "3", title: "Operasional", desc: "Scan absensi harian — data langsung masuk dashboard" },
                  { step: "4", title: "Notifikasi", desc: "Wali murid menerima WhatsApp otomatis" },
                  { step: "5", title: "Monitoring", desc: "Sekolah pantau & rekap laporan kapan saja" },
                ].map((s, i) => (
                  <div key={i} className="flex-1 relative">
                    <Card className="border-0 shadow-sm h-full">
                      <CardContent className="p-4 text-center">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto mb-2">
                          {s.step}
                        </div>
                        <h4 className="text-xs font-bold text-foreground mb-1">{s.title}</h4>
                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3.3 Kualitas */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.3</span> Kualitas dan Pengendalian Kualitas
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { icon: ShieldCheck, title: "Uptime 99.9%", desc: "Infrastruktur cloud dengan redundansi tinggi memastikan sistem selalu tersedia" },
                      { icon: Wifi, title: "Response Time < 500ms", desc: "Optimisasi performa API untuk pengalaman scan yang instan" },
                      { icon: Shield, title: "Data Terenkripsi", desc: "Semua data siswa dienkripsi end-to-end sesuai standar keamanan" },
                      { icon: Smartphone, title: "Support 24/7", desc: "Tim support siap membantu via live chat, ticket, dan WhatsApp" },
                    ].map((q, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <q.icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{q.title}</p>
                          <p className="text-xs text-muted-foreground">{q.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Section>

          {/* ════════════════ BAB IV ════════════════ */}
          <Section id="bab4" className="bg-muted/20">
            <SectionTitle bab="BAB IV" title="Manajemen dan Organisasi" icon={Users} />

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">4.1</span> Struktur Organisasi
              </h3>
              <div className="flex flex-col items-center">
                {/* CEO */}
                <OrgCard title="CEO / Founder" name="[Nama Founder]" desc="Penanggung jawab utama, strategi bisnis & produk" color="bg-primary" />
                <div className="h-6 w-px bg-border" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                  <OrgCard title="CTO" name="[Nama CTO]" desc="Pengembangan teknologi & infrastruktur" color="bg-cyan-500" />
                  <OrgCard title="CMO" name="[Nama CMO]" desc="Marketing, sales & akuisisi pelanggan" color="bg-amber-500" />
                  <OrgCard title="COO" name="[Nama COO]" desc="Operasional, support & customer success" color="bg-emerald-500" />
                </div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">4.2</span> Tim Manajemen
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    Tim ATSkolla terdiri dari profesional muda dengan pengalaman di bidang teknologi pendidikan, 
                    software engineering, dan pemasaran digital.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { role: "Full-Stack Developer", count: "2 orang", skill: "React, Node.js, Supabase, AI" },
                      { role: "UI/UX Designer", count: "1 orang", skill: "Figma, User Research" },
                      { role: "Sales & Marketing", count: "2 orang", skill: "Direct selling, digital marketing" },
                      { role: "Customer Success", count: "1 orang", skill: "Onboarding, training, support" },
                    ].map((member) => (
                      <div key={member.role} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-sm font-bold text-foreground">{member.role}</p>
                        <p className="text-xs text-primary font-medium">{member.count}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{member.skill}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Section>

          {/* ════════════════ BAB V ════════════════ */}
          <Section id="bab5">
            <SectionTitle bab="BAB V" title="Analisis Keuangan" icon={DollarSign} />

            {/* 5.1 Proyeksi */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">5.1</span> Proyeksi Pendapatan & Pengeluaran (2 Tahun)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-bold text-foreground rounded-tl-lg">Keterangan</th>
                      <th className="text-right p-3 font-bold text-foreground">Tahun 1</th>
                      <th className="text-right p-3 font-bold text-foreground rounded-tr-lg">Tahun 2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Jumlah Sekolah Berlangganan", "50", "200"],
                      ["Pendapatan SaaS (Rp)", "120.000.000", "600.000.000"],
                      ["Pendapatan Enterprise (Rp)", "30.000.000", "150.000.000"],
                      ["Pendapatan Add-on (Rp)", "10.000.000", "50.000.000"],
                      ["Total Pendapatan (Rp)", "160.000.000", "800.000.000"],
                      ["", "", ""],
                      ["Biaya Server & Cloud (Rp)", "24.000.000", "60.000.000"],
                      ["Gaji Tim (Rp)", "72.000.000", "180.000.000"],
                      ["Marketing (Rp)", "30.000.000", "80.000.000"],
                      ["WhatsApp API (Rp)", "12.000.000", "40.000.000"],
                      ["Operasional Lain (Rp)", "10.000.000", "20.000.000"],
                      ["Total Pengeluaran (Rp)", "148.000.000", "380.000.000"],
                      ["", "", ""],
                      ["Laba Bersih (Rp)", "12.000.000", "420.000.000"],
                    ].map(([label, y1, y2], i) => (
                      label === "" ? <tr key={i}><td colSpan={3} className="h-2" /></tr> :
                      <tr key={i} className={`hover:bg-muted/20 transition ${label.includes("Total") || label.includes("Laba") ? "font-bold" : ""}`}>
                        <td className={`p-3 ${label.includes("Laba") ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{label}</td>
                        <td className={`p-3 text-right ${label.includes("Laba") ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{y1}</td>
                        <td className={`p-3 text-right ${label.includes("Laba") ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{y2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 5.2 Perencanaan Modal */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">5.2</span> Perencanaan Modal
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Modal awal yang dibutuhkan sebesar <strong className="text-foreground">Rp 50.000.000</strong> dengan alokasi:
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Pengembangan Platform", pct: 40, amount: "Rp 20.000.000" },
                      { label: "Marketing & Akuisisi", pct: 25, amount: "Rp 12.500.000" },
                      { label: "Infrastruktur Cloud (6 bulan)", pct: 15, amount: "Rp 7.500.000" },
                      { label: "Operasional & Cadangan", pct: 20, amount: "Rp 10.000.000" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">{item.amount} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 5.3 Analisis Risiko */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">5.3</span> Analisis Risiko
              </h3>
              <div className="space-y-3">
                {[
                  {
                    risk: "Adopsi Lambat oleh Sekolah",
                    level: "Sedang",
                    mitigation: "Free trial 14 hari, demo langsung, testimoni sekolah pengguna, dan dukungan onboarding penuh",
                  },
                  {
                    risk: "Gangguan Teknis / Downtime",
                    level: "Rendah",
                    mitigation: "Infrastruktur cloud dengan auto-scaling, backup harian, dan monitoring 24/7",
                  },
                  {
                    risk: "Persaingan Kompetitor",
                    level: "Sedang",
                    mitigation: "Inovasi fitur berkelanjutan (Face AI, pickup system), harga kompetitif, dan USP yang kuat",
                  },
                  {
                    risk: "Ketergantungan WhatsApp API",
                    level: "Rendah",
                    mitigation: "Multi-channel fallback (SMS, email, push notification) dan diversifikasi provider API",
                  },
                ].map((r, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <AlertTriangle className={`h-4 w-4 ${r.level === "Rendah" ? "text-emerald-500" : "text-amber-500"}`} />
                        <div>
                          <p className="text-sm font-bold text-foreground">{r.risk}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.level === "Rendah" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>{r.level}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex-1">
                        <strong>Mitigasi:</strong> {r.mitigation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </Section>

          {/* ════════════════ BAB VI ════════════════ */}
          <Section id="bab6" className="bg-muted/20">
            <SectionTitle bab="BAB VI" title="Kesimpulan" icon={CheckCircle2} />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    ATSkolla merupakan solusi absensi digital yang hadir untuk menjawab permasalahan nyata di dunia 
                    pendidikan Indonesia. Dengan menggabungkan teknologi barcode scanning, face recognition AI, 
                    notifikasi WhatsApp otomatis, dan dashboard monitoring real-time, ATSkolla menawarkan ekosistem 
                    yang komprehensif untuk sekolah.
                  </p>
                  <p>
                    Dengan potensi pasar 436.000+ sekolah, model bisnis SaaS yang terbukti sustainable, dan 
                    keunggulan kompetitif yang jelas, ATSkolla berpotensi menjadi pemain utama di pasar EdTech 
                    Indonesia. Proyeksi menunjukkan break-even di tahun pertama dan pertumbuhan pendapatan 
                    signifikan di tahun kedua.
                  </p>
                  <p>
                    Kami yakin ATSkolla tidak hanya sekadar alat absensi, tetapi merupakan fondasi transformasi 
                    digital sekolah Indonesia — menjadikan proses administrasi lebih efisien, orang tua lebih 
                    tenang, dan siswa lebih aman.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Section>

          {/* ════════════════ BAB VII ════════════════ */}
          <Section id="bab7">
            <SectionTitle bab="BAB VII" title="Daftar Pustaka" icon={BookOpen} />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-2 text-xs text-muted-foreground">
                  {[
                    "Kementerian Pendidikan dan Kebudayaan. (2024). Data Referensi Pendidikan. https://referensi.data.kemdikbud.go.id",
                    "Badan Pusat Statistik. (2024). Statistik Pendidikan Indonesia.",
                    "Osterwalder, A., & Pigneur, Y. (2010). Business Model Generation. John Wiley & Sons.",
                    "McKinsey & Company. (2023). The State of EdTech in Southeast Asia.",
                    "Fonnte. (2024). WhatsApp API Documentation. https://fonnte.com",
                  ].map((ref, i) => (
                    <p key={i} className="pl-6 -indent-6">[{i + 1}] {ref}</p>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </Section>

          {/* ════════════════ BAB VIII ════════════════ */}
          <Section id="bab8" className="bg-muted/20 pb-20">
            <SectionTitle bab="BAB VIII" title="Lampiran" icon={FileCheck} />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                  <p>Lampiran yang dapat disertakan:</p>
                  <ul className="space-y-2">
                    {[
                      "Screenshot tampilan dashboard ATSkolla",
                      "Mockup kartu pelajar digital dengan barcode",
                      "Contoh notifikasi WhatsApp yang diterima wali murid",
                      "Sertifikat & penghargaan tim",
                      "Surat kerjasama / MoU dengan sekolah mitra",
                      "Dokumentasi kegiatan demo & onboarding",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold text-xs">{i + 1}.</span>
                        <span className="text-xs">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </Section>
        </main>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */
const BmcBlock = ({ title, items, icon: Icon, className, color }: {
  title: string; items: string[]; icon: any; className: string; color: string;
}) => (
  <div className={`p-3 sm:p-4 ${className}`}>
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${color}`}>{title}</h4>
    </div>
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-[9px] sm:text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
          <span className={`mt-1 h-1 w-1 rounded-full shrink-0 ${color.replace("text-", "bg-")}`} />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const OrgCard = ({ title, name, desc, color }: { title: string; name: string; desc: string; color: string }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4 text-center">
      <div className={`h-10 w-10 rounded-full ${color} text-white text-xs font-bold flex items-center justify-center mx-auto mb-2`}>
        {title.split(" ")[0].charAt(0)}
      </div>
      <p className="text-xs font-bold text-foreground">{title}</p>
      <p className="text-[10px] text-primary font-medium">{name}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
    </CardContent>
  </Card>
);

export default Proposal;
