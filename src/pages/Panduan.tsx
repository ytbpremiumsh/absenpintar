import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, School, GraduationCap, ClipboardCheck, Users,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";

type Step = {
  title: string;
  description: string;
  image?: string;
  bullets?: string[];
};

type RoleGuide = {
  id: "school" | "teacher" | "wali-kelas" | "parent";
  label: string;
  shortLabel: string;
  icon: typeof School;
  color: string;
  intro: string;
  steps: Step[];
};

const GUIDES: RoleGuide[] = [
  {
    id: "school",
    label: "Admin Sekolah",
    shortLabel: "Sekolah",
    icon: School,
    color: "from-indigo-500 to-blue-600",
    intro:
      "Panduan lengkap untuk Admin Sekolah / Operator dalam mengelola data sekolah, siswa, kelas, absensi, dan laporan.",
    steps: [
      {
        title: "1. Dashboard Utama",
        description:
          "Setelah login, Anda akan masuk ke Dashboard Sekolah. Di sini ditampilkan ringkasan kehadiran hari ini, total siswa, kelas, dan jadwal live.",
        image: "/panduan/school-dashboard.jpg",
        bullets: [
          "Lihat persentase kehadiran hari ini di banner biru atas.",
          "Kartu statistik: Total Kelas, Siswa Terdaftar, Hadir Hari Ini, Belum/Alfa.",
          "Grafik harian / mingguan / bulanan untuk analisa kehadiran.",
        ],
      },
      {
        title: "2. Monitoring Real-time",
        description:
          "Menu Monitoring menampilkan absensi yang masuk secara real-time. Cocok ditampilkan di TV sekolah lewat tombol 'Live Monitor Publik'.",
        image: "/panduan/school-monitoring.jpg",
        bullets: [
          "Lihat status: Hadir, Izin, Sakit, Alfa, Belum.",
          "Progress bar kehadiran realtime.",
          "Live Feed siswa yang datang dan pulang.",
        ],
      },
      {
        title: "3. Scan Absensi",
        description:
          "Buka menu Scan Absensi untuk melakukan absensi via Barcode/QR atau Face Recognition. Bisa juga input NIS manual.",
        image: "/panduan/school-scan.jpg",
        bullets: [
          "Klik 'Aktifkan Kamera' lalu arahkan ke QR Code siswa.",
          "Pilih mode Barcode atau Face Recognition.",
          "Gunakan Input NIS Manual jika kamera tidak tersedia.",
        ],
      },
      {
        title: "4. Kelola Kelas",
        description:
          "Menu Kelas digunakan untuk membuat dan mengatur daftar kelas. Tiap kelas akan otomatis menampilkan rekap absensi harian.",
        image: "/panduan/school-classes.jpg",
        bullets: [
          "Klik 'Tambah Kelas' untuk membuat kelas baru.",
          "Edit nama kelas — sinkron otomatis ke siswa & wali kelas.",
          "Klik kartu kelas untuk lihat detail siswa dan absensi.",
        ],
      },
      {
        title: "5. Data Siswa",
        description:
          "Kelola data siswa termasuk QR Code, foto wajah untuk Face Recognition, NIS, dan kontak wali murid.",
        image: "/panduan/school-students.jpg",
        bullets: [
          "Tombol 'Tambah Siswa' untuk input manual.",
          "Tombol 'Import' untuk upload Excel massal.",
          "'Naik Kelas' untuk pindahkan siswa antar kelas.",
          "'Download QR' untuk cetak kartu QR siswa.",
        ],
      },
      {
        title: "6. Pengumuman Sekolah",
        description:
          "Kirim pengumuman ke seluruh staf, guru, dan wali kelas. Bisa diberi label Informasi, Penting, atau Mendesak.",
        image: "/panduan/school-announcements.jpg",
        bullets: [
          "Klik 'Buat Baru' untuk membuat pengumuman.",
          "Atur target: Staf, Guru, atau Wali Kelas.",
          "Tandai pengumuman penting agar tampil di dashboard.",
        ],
      },
      {
        title: "7. Laporan & Rekap",
        description:
          "Menu History menampilkan analitik dan rekap kehadiran lengkap. Bisa export ke Excel.",
        image: "/panduan/school-history.jpg",
        bullets: [
          "Pilih rentang tanggal: 30, 60, atau 90 hari.",
          "Tab 'Rekap Kehadiran' atau 'Rekap Kepulangan'.",
          "Filter per kelas untuk drill-down.",
          "Klik 'Export Excel' untuk unduh laporan.",
        ],
      },
    ],
  },
  {
    id: "teacher",
    label: "Guru / Staff",
    shortLabel: "Guru",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-600",
    intro:
      "Panduan untuk Guru dan Staff dalam mengakses jadwal mengajar, mencatat kehadiran, dan melihat pengumuman.",
    steps: [
      {
        title: "1. Dashboard Guru",
        description:
          "Halaman utama guru menampilkan ringkasan jadwal hari ini, mata pelajaran yang sedang berlangsung, dan pengumuman sekolah.",
        image: "/panduan/teacher-dashboard.jpg",
        bullets: [
          "Lihat 'Jadwal Hari Ini' dan 'Sedang Berlangsung'.",
          "Total mata pelajaran dan kelas yang diampu.",
          "Pengumuman Sekolah tampil otomatis.",
        ],
      },
      {
        title: "2. Jadwal Mengajar",
        description:
          "Menu Jadwal Mengajar berisi seluruh jadwal mata pelajaran per hari, lengkap dengan ruangan dan kelas.",
        image: "/panduan/teacher-schedule.jpg",
        bullets: [
          "Filter per hari atau cari nama guru/mapel.",
          "Tab 'Jadwal' dan 'Mata Pelajaran' terpisah.",
          "Total Jadwal, Guru, Mapel, dan Kelas terjadwal.",
        ],
      },
      {
        title: "3. Jadwal Live",
        description:
          "Lihat jadwal pelajaran yang sedang berlangsung secara realtime, dengan progress bar kelas.",
        image: "/panduan/live-schedule.jpg",
        bullets: [
          "Highlight 'LIVE' untuk kelas yang sedang berlangsung.",
          "Progress bar menunjukkan sisa waktu pelajaran.",
          "Filter berdasarkan guru atau kelas.",
        ],
      },
      {
        title: "4. Scan Absensi Manual",
        description:
          "Guru dapat melakukan absensi manual untuk siswa di kelasnya melalui menu Scan.",
        image: "/panduan/school-scan.jpg",
        bullets: [
          "Pilih siswa lalu tandai status: Hadir/Izin/Sakit/Alfa.",
          "Status 'Alfa' harus diinput manual oleh guru.",
          "Notifikasi WhatsApp ke wali murid otomatis terkirim.",
        ],
      },
    ],
  },
  {
    id: "wali-kelas",
    label: "Wali Kelas",
    shortLabel: "Wali Kelas",
    icon: ClipboardCheck,
    color: "from-violet-500 to-purple-600",
    intro:
      "Panduan untuk Wali Kelas dalam memantau siswa kelasnya, leaderboard, dan rekap kehadiran.",
    steps: [
      {
        title: "1. Dashboard Wali Kelas",
        description:
          "Setelah ditugaskan oleh Admin Sekolah, Anda akan melihat dashboard berisi statistik kelas yang Anda ampu.",
        image: "/panduan/wali-kelas-dashboard.jpg",
        bullets: [
          "Total siswa, kehadiran hari ini, dan trend mingguan.",
          "Leaderboard absensi siswa di kelas Anda.",
          "Jika belum ditugaskan, hubungi Admin Sekolah.",
        ],
      },
      {
        title: "2. Siswa Kelas Saya",
        description:
          "Lihat dan kelola data siswa di kelas yang Anda ampu, termasuk kontak wali murid.",
        bullets: [
          "Daftar lengkap siswa dengan foto profil.",
          "Klik nama siswa untuk lihat detail kehadiran.",
          "Akses data wali murid untuk komunikasi langsung.",
        ],
      },
      {
        title: "3. Absensi Manual Kelas",
        description:
          "Catat kehadiran siswa kelas Anda secara manual untuk semua status (Hadir, Izin, Sakit, Alfa).",
        bullets: [
          "Pilih tanggal dan tandai status tiap siswa.",
          "Status Alfa hanya bisa diinput manual.",
          "Edit absensi yang salah lewat menu History.",
        ],
      },
      {
        title: "4. History & Export Kelas",
        description:
          "Lihat riwayat absensi kelas Anda dan export ke Excel untuk laporan ke kepala sekolah.",
        image: "/panduan/school-history.jpg",
        bullets: [
          "Filter rentang tanggal (harian/mingguan/bulanan).",
          "Rekap individual per siswa.",
          "Export ke Excel format siap cetak.",
        ],
      },
    ],
  },
  {
    id: "parent",
    label: "Wali Murid",
    shortLabel: "Wali Murid",
    icon: Users,
    color: "from-pink-500 to-rose-600",
    intro:
      "Panduan untuk Wali Murid dalam memantau kehadiran ananda melalui Portal Wali Murid (login via WhatsApp OTP).",
    steps: [
      {
        title: "1. Login Portal Wali Murid",
        description:
          "Buka halaman /parent/login lalu masukkan nomor WhatsApp yang terdaftar di sekolah ananda.",
        image: "/panduan/parent-login.jpg",
        bullets: [
          "Pastikan nomor WA sudah didaftarkan oleh sekolah.",
          "Klik 'Kirim Kode OTP' untuk menerima kode 6 digit via WhatsApp.",
          "Masukkan OTP — tidak perlu password.",
        ],
      },
      {
        title: "2. Dashboard Wali Murid",
        description:
          "Setelah login, Anda akan melihat ringkasan kehadiran ananda hari ini dan jadwal pelajarannya.",
        bullets: [
          "Status kehadiran terkini (Hadir/Izin/Sakit/Alfa/Belum).",
          "Statistik kehadiran bulan berjalan.",
          "Notifikasi otomatis saat ananda datang & pulang sekolah.",
        ],
      },
      {
        title: "3. Riwayat Kehadiran",
        description:
          "Pantau riwayat kehadiran ananda dalam bentuk kalender bulanan dan grafik.",
        bullets: [
          "Klik tanggal di kalender untuk lihat detail.",
          "Persentase kehadiran per bulan.",
          "Histori jam datang dan pulang.",
        ],
      },
      {
        title: "4. Tagihan SPP",
        description:
          "Jika sekolah mengaktifkan modul SPP, Anda dapat melihat tagihan dan melakukan pembayaran online.",
        bullets: [
          "Daftar tagihan SPP per bulan.",
          "Klik 'Bayar Sekarang' untuk pembayaran via QRIS/Bank.",
          "Notifikasi WA otomatis saat pembayaran sukses.",
        ],
      },
      {
        title: "5. Pengajuan Izin",
        description:
          "Ajukan izin atau sakit untuk ananda langsung dari portal tanpa perlu datang ke sekolah.",
        bullets: [
          "Pilih tanggal dan jenis izin (Sakit/Izin).",
          "Upload surat keterangan jika perlu.",
          "Wali kelas akan menerima notifikasi.",
        ],
      },
    ],
  },
];

export default function Panduan() {
  const [active, setActive] = useState<RoleGuide["id"]>("school");
  const guide = GUIDES.find((g) => g.id === active)!;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-[#5B6CF9] transition-colors" />
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center">
              <img src={atskollaLogo} alt="ATSkolla" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-bold text-slate-900">ATSkolla</span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-semibold text-[#5B6CF9] hover:text-[#4c5ded] transition-colors"
          >
            Masuk Aplikasi →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B6CF9]/10 text-[#5B6CF9] text-xs font-semibold mb-4">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Panduan Penggunaan ATSkolla
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
          Pelajari ATSkolla dalam 5 Menit
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
          Tutorial step-by-step untuk setiap peran — Admin Sekolah, Guru, Wali Kelas,
          dan Wali Murid.
        </p>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-4 sticky top-[57px] z-20 bg-gradient-to-b from-slate-50 to-slate-50/95 backdrop-blur pt-2 pb-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {GUIDES.map((g) => {
            const Icon = g.icon;
            const isActive = g.id === active;
            return (
              <button
                key={g.id}
                onClick={() => setActive(g.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${g.color} text-white shadow-lg scale-[1.02]`
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{g.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${guide.color} flex items-center justify-center shadow-lg shrink-0`}
            >
              <guide.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Panduan {guide.label}
              </h2>
              <p className="text-slate-500 leading-relaxed">{guide.intro}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {guide.steps.map((step, idx) => (
            <article
              key={idx}
              className="bg-white border border-slate-200 rounded-3xl p-5 md:p-7 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                {step.description}
              </p>

              {step.bullets && (
                <ul className="space-y-2 mb-4">
                  {step.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-[#5B6CF9] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.image && (
                <div className="rounded-2xl overflow-hidden bg-slate-50">
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] rounded-3xl p-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-2">Siap Mencoba?</h3>
          <p className="text-white/80 mb-5">
            Mulai gunakan ATSkolla untuk mengelola absensi sekolah Anda.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white text-[#5B6CF9] font-bold hover:bg-slate-100 transition-colors"
            >
              Masuk Aplikasi
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl border border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 mt-12 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ATSkolla — Platform Digital Sekolah
      </footer>
    </div>
  );
}
