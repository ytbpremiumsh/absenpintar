import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, School, GraduationCap, ClipboardCheck, Users, Wallet,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";

type Step = {
  title: string;
  description: string;
  image?: string;
  bullets?: string[];
  tips?: string[];
};

type RoleGuide = {
  id: "school" | "teacher" | "wali-kelas" | "bendahara" | "parent";
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
      "Panduan lengkap untuk Admin Sekolah / Operator dalam mengelola data sekolah, siswa, kelas, absensi, dan laporan dari A sampai Z.",
    steps: [
      {
        title: "1. Dashboard Utama",
        description:
          "Setelah login, Anda akan masuk ke Dashboard Sekolah. Halaman ini menampilkan ringkasan kehadiran hari ini, total siswa, kelas, dan jadwal live. Cocok sebagai control panel harian.",
        image: "/panduan/school-dashboard.jpg",
        bullets: [
          "Banner biru atas: persentase kehadiran + tombol shortcut Scan Absensi.",
          "Kartu statistik: Total Kelas, Siswa Terdaftar, Hadir Hari Ini, Belum/Alfa.",
          "Grafik harian / mingguan / bulanan untuk analisa kehadiran.",
          "Widget 'Sedang Berlangsung' menampilkan jadwal kelas live.",
          "Pengumuman Sekolah aktif tampil otomatis di bawah.",
        ],
        tips: [
          "Gunakan tombol mode gelap (ikon bulan) di pojok kanan atas untuk menyesuaikan tampilan.",
          "Klik kartu statistik untuk drill-down ke menu terkait.",
        ],
      },
      {
        title: "2. Monitoring Real-time",
        description:
          "Menu Monitoring menampilkan absensi yang masuk secara real-time. Cocok ditampilkan di TV sekolah lewat tombol 'Live Monitor Publik'.",
        image: "/panduan/school-monitoring.jpg",
        bullets: [
          "Status: Hadir, Izin, Sakit, Alfa, Belum (status netral untuk yang belum absen).",
          "Progress bar kehadiran realtime per kelas.",
          "Live Feed siswa yang datang dan pulang dengan jam tepat.",
          "Filter per kelas untuk fokus pengawasan.",
          "Tombol 'Live Monitor Publik' membuka tampilan TV tanpa login.",
        ],
        tips: [
          "Buka 'Live Monitor Publik' di tab terpisah dan tampilkan di TV gerbang sekolah.",
          "Status 'Alfa' tidak akan muncul otomatis — guru/wali kelas harus input manual.",
        ],
      },
      {
        title: "3. Scan Absensi",
        description:
          "Buka menu Scan Absensi untuk melakukan absensi via Barcode/QR atau Face Recognition. Bisa juga input NIS manual jika kamera bermasalah.",
        image: "/panduan/school-scan.jpg",
        bullets: [
          "Klik 'Aktifkan Kamera' lalu arahkan ke QR Code siswa.",
          "Mode QR/Barcode auto-confirm setelah 3 detik deteksi stabil.",
          "Mode Face Recognition: interval 10 detik per wajah.",
          "Input NIS Manual untuk fallback jika kamera tidak tersedia.",
          "Suara konfirmasi (TTS) otomatis menyebut nama siswa.",
        ],
        tips: [
          "Gunakan tablet/HP yang dipasang di gerbang untuk scan mandiri.",
          "Pastikan foto wajah sudah terdaftar di Data Siswa untuk Face Recognition.",
        ],
      },
      {
        title: "4. Kelola Kelas",
        description:
          "Menu Kelas digunakan untuk membuat dan mengatur daftar kelas. Tiap kelas otomatis menampilkan rekap absensi harian dan total siswa.",
        image: "/panduan/school-classes.jpg",
        bullets: [
          "Klik 'Tambah Kelas' untuk membuat kelas baru.",
          "Edit nama kelas — sinkron otomatis ke siswa & wali kelas.",
          "Klik kartu kelas untuk lihat detail siswa dan absensi hari ini.",
          "Kapasitas kelas mengikuti tier subscription Anda.",
        ],
      },
      {
        title: "5. Data Siswa",
        description:
          "Kelola data siswa termasuk QR Code, foto wajah untuk Face Recognition, NIS, gender, dan kontak wali murid.",
        image: "/panduan/school-students.jpg",
        bullets: [
          "Tombol 'Tambah Siswa' untuk input manual satu per satu.",
          "Tombol 'Import' untuk upload Excel massal (template tersedia).",
          "'Naik Kelas' untuk pindahkan siswa antar kelas (single/bulk).",
          "'Download QR' untuk cetak kartu QR siswa per kelas.",
          "Klik nama siswa untuk lihat detail kehadiran lengkap.",
        ],
        tips: [
          "Pastikan nomor WhatsApp wali murid valid & aktif untuk notifikasi otomatis.",
          "Foto wajah disarankan close-up dengan pencahayaan baik untuk akurasi Face Recognition.",
        ],
      },
      {
        title: "6. Pengumuman Sekolah",
        description:
          "Kirim pengumuman ke seluruh staf, guru, dan wali kelas. Bisa diberi label Informasi, Penting, atau Mendesak.",
        image: "/panduan/school-announcements.jpg",
        bullets: [
          "Klik 'Buat Baru' untuk membuat pengumuman dengan rich text editor.",
          "Atur target: Staf, Guru, atau Wali Kelas (multi-select).",
          "Tandai pengumuman penting agar tampil di top dashboard.",
          "Pengumuman dikirim juga sebagai notifikasi in-app.",
        ],
      },
      {
        title: "7. Laporan & Rekap (History)",
        description:
          "Menu History menampilkan analitik dan rekap kehadiran lengkap. Bisa export ke Excel format siap laporan.",
        image: "/panduan/school-history.jpg",
        bullets: [
          "Pilih rentang tanggal: 30, 60, atau 90 hari.",
          "Tab 'Rekap Kehadiran' (Datang) dan 'Rekap Kepulangan' terpisah.",
          "Filter per kelas untuk drill-down detail.",
          "Klik 'Export Excel' untuk unduh laporan lengkap dengan tanda tangan.",
          "Status Datang & Pulang dipisah ketat — tidak tercampur.",
        ],
      },
      {
        title: "8. Pengaturan Sekolah",
        description:
          "Atur identitas sekolah (nama, NPSN, alamat, logo), zona waktu (WIB/WITA/WIT), dan jam absensi default.",
        bullets: [
          "Logo sekolah otomatis sinkron ke sidebar, kartu ID, dan notifikasi WA.",
          "Zona waktu menentukan jam cut-off absensi.",
          "Atur jam masuk & jam pulang default untuk validasi otomatis.",
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
      "Panduan untuk Guru Mata Pelajaran dalam mengakses jadwal mengajar, mencatat kehadiran per mapel, dan melihat rekap absensi.",
    steps: [
      {
        title: "1. Dashboard Guru",
        description:
          "Halaman utama guru menampilkan ringkasan jadwal hari ini, mata pelajaran yang sedang berlangsung, dan pengumuman sekolah dari admin.",
        image: "/panduan/teacher-dashboard-uswatun.jpg",
        bullets: [
          "Kartu: Jadwal Hari Ini, Sedang Berlangsung, Mata Pelajaran, Total Kelas.",
          "Widget 'Pengumuman Sekolah' tampil otomatis di tengah.",
          "Section 'Jadwal Hari Ini' menampilkan semua sesi mengajar hari ini lengkap dengan ruangan & kelas.",
          "Tombol 'Lihat Absensi' di tiap jadwal untuk langsung mencatat kehadiran sesi.",
        ],
        tips: [
          "Status sesi: aktif (hijau), akan datang (kuning), selesai (abu).",
          "Notifikasi pengingat mengajar dikirim 15 menit sebelum sesi.",
        ],
      },
      {
        title: "2. Jadwal Mengajar",
        description:
          "Menu Jadwal Mengajar berisi seluruh jadwal mata pelajaran per hari, lengkap dengan ruangan, kelas, dan total sesi mingguan.",
        image: "/panduan/teacher-schedule-real.jpg",
        bullets: [
          "Filter per hari atau cari berdasarkan nama guru/mapel/kelas.",
          "Tab 'Jadwal' (per hari) dan 'Mata Pelajaran' (per mapel) terpisah.",
          "Statistik: Total Jadwal, Guru Terjadwal, Mata Pelajaran, Kelas Terjadwal.",
          "Warna titik di tiap mapel untuk visual identifikasi cepat.",
        ],
      },
      {
        title: "3. Rekap Absensi Mapel",
        description:
          "Lihat rekap kehadiran siswa per mata pelajaran yang Anda ampu, dalam format grid harian (1-31).",
        image: "/panduan/teacher-rekap-mapel.jpg",
        bullets: [
          "Pilih kombinasi Mapel + Kelas (misal 'TKJ 1 - PAI').",
          "Filter Bulan & Tahun untuk navigasi periode.",
          "Legend warna: H=Hadir (hijau), S=Sakit (ungu), I=Izin (kuning), A=Alfa (merah).",
          "Tombol 'Export Excel' untuk laporan ke wali kelas/admin.",
        ],
        tips: [
          "Grid 1-31 menampilkan status per tanggal — kosong = tidak ada sesi.",
          "Klik bulatan tanggal untuk edit cepat status absensi.",
        ],
      },
      {
        title: "4. Analytic Mapel",
        description:
          "Halaman analisa per mata pelajaran dengan grafik distribusi & tren kehadiran siswa.",
        bullets: [
          "Donut chart distribusi: Hadir / Izin / Sakit / Alfa.",
          "Bar chart tren harian per mapel.",
          "Ringkasan per siswa: jumlah hadir, alfa, persentase.",
        ],
      },
      {
        title: "5. Jadwal Live (Public)",
        description:
          "Lihat jadwal pelajaran yang sedang berlangsung secara realtime, dengan progress bar kelas. Bisa diakses tanpa login.",
        image: "/panduan/live-schedule.jpg",
        bullets: [
          "Highlight 'LIVE' untuk kelas yang sedang berlangsung.",
          "Progress bar menunjukkan sisa waktu pelajaran.",
          "Filter berdasarkan guru atau kelas.",
          "Cocok ditampilkan di TV ruang guru.",
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
      "Panduan untuk Wali Kelas (contoh: Ibu Uswatun Khasanah, S.Pd) dalam memantau siswa kelasnya, leaderboard antar kelas, absensi manual, dan pengajuan izin.",
    steps: [
      {
        title: "1. Dashboard Wali Kelas",
        description:
          "Setelah ditugaskan oleh Admin Sekolah, Anda akan melihat dashboard berisi statistik kelas yang Anda ampu (bisa lebih dari 1 kelas).",
        image: "/panduan/wali-kelas-dashboard-uswatun.jpg",
        bullets: [
          "Kartu statistik: Total Siswa, Hadir, Izin, Sakit, Alfa, Belum.",
          "Progress Absensi Hari Ini dengan persentase realtime.",
          "Daftar siswa lengkap dengan status & jam absensi terkini.",
          "Search bar untuk cari siswa cepat.",
          "Toggle tab: Dashboard / Peringkat Kelas.",
        ],
        tips: [
          "Jika belum ada kelas yang ditugaskan, hubungi Admin Sekolah.",
          "Header menampilkan: 'Kelas: TKJ 2, TKJ 3' — daftar kelas yang Anda ampu.",
        ],
      },
      {
        title: "2. Peringkat Kelas (Leaderboard)",
        description:
          "Bandingkan kelas Anda dengan kelas lain di sekolah dalam hal persentase kehadiran 30 hari terakhir.",
        image: "/panduan/wali-kelas-leaderboard.jpg",
        bullets: [
          "'Posisi Kelas Anda' menampilkan ranking & persentase.",
          "Bar chart 'Perbandingan Kehadiran Semua Kelas' — kelas Anda berwarna biru.",
          "Realtime — update otomatis saat ada absensi baru.",
          "Memotivasi peningkatan disiplin antar kelas.",
        ],
      },
      {
        title: "3. Absensi Manual Kelas",
        description:
          "Catat kehadiran siswa kelas Anda secara manual untuk semua status (Hadir, Izin, Sakit, Alfa). Status Alfa STRICTLY manual.",
        image: "/panduan/wali-kelas-attendance.jpg",
        bullets: [
          "Pilih kelas (dropdown TKJ 2/TKJ 3) dan tanggal.",
          "Tombol H/S/I/A di kolom kanan tiap siswa untuk tandai status.",
          "Counter '2/4 terisi' menunjukkan progres input.",
          "Tombol 'Simpan' aktif setelah ada perubahan.",
          "Notifikasi WhatsApp ke wali murid otomatis terkirim setelah simpan.",
        ],
        tips: [
          "Status Alfa HANYA bisa diinput manual — sistem tidak mengisi otomatis.",
          "Edit absensi yang salah lewat menu History.",
        ],
      },
      {
        title: "4. Siswa Kelas Saya",
        description:
          "Lihat dan kelola data siswa di kelas yang Anda ampu, termasuk kontak wali murid dan persentase kehadiran.",
        image: "/panduan/wali-kelas-students.jpg",
        bullets: [
          "Statistik: Total Siswa, Laki-laki, Perempuan, Nama Kelas.",
          "Daftar siswa dengan persentase kehadiran (warna: hijau=baik, kuning=perhatian).",
          "Klik nama siswa untuk lihat detail kehadiran & data wali.",
          "Search bar untuk cari siswa atau nama wali murid.",
        ],
      },
      {
        title: "5. Rekap Absensi Kelas",
        description:
          "Lihat riwayat absensi kelas Anda dalam format grid harian. Tab Datang & Pulang terpisah.",
        image: "/panduan/wali-kelas-rekap.jpg",
        bullets: [
          "Filter Bulan, Tahun, Kelas.",
          "Tab 'Rekap Kehadiran' (Datang) vs 'Rekap Kepulangan'.",
          "Grid bulatan warna per tanggal (1-31).",
          "Tombol 'Export Excel' untuk laporan ke kepala sekolah.",
        ],
      },
      {
        title: "6. Analytic Kelas Wali",
        description:
          "Analisa mendalam kehadiran kelas wali Anda dalam bentuk donut chart, tren harian, dan ringkasan per siswa.",
        image: "/panduan/wali-kelas-analytic.jpg",
        bullets: [
          "Filter rentang: 7 hari / 14 hari / 30 hari / custom.",
          "Donut: Distribusi Status (Hadir/Izin/Sakit/Alfa) dengan persentase.",
          "Bar chart 'Tren Harian' menampilkan stack komposisi.",
          "'Ringkasan Per Siswa' menunjukkan siswa dengan absensi tertinggi/terendah.",
        ],
      },
      {
        title: "7. Pengajuan Izin / Sakit",
        description:
          "Setujui atau tolak pengajuan izin & sakit dari wali murid kelas Anda.",
        image: "/panduan/wali-kelas-leave.jpg",
        bullets: [
          "Statistik: Menunggu, Disetujui, Ditolak.",
          "Tab filter: Menunggu / Disetujui / Ditolak / Semua.",
          "Klik kartu pengajuan untuk lihat detail + lampiran surat.",
          "Tombol Setujui/Tolak — wali murid otomatis menerima notifikasi WA.",
        ],
      },
    ],
  },
  {
    id: "bendahara",
    label: "Bendahara",
    shortLabel: "Bendahara",
    icon: Wallet,
    color: "from-emerald-600 to-teal-700",
    intro:
      "Panduan untuk Bendahara Sekolah dalam mengelola tarif SPP, generate tagihan, mencatat pembayaran, dan melakukan pencairan saldo.",
    steps: [
      {
        title: "1. Dashboard Bendahara",
        description:
          "Halaman utama menampilkan ringkasan keuangan SPP: total tagihan bulan ini, sudah dibayar, tunggakan, dan saldo pencairan.",
        bullets: [
          "Kartu: Total Tagihan Bulan Ini, Sudah Dibayar, Tunggakan, Saldo Cair.",
          "Grafik tren pembayaran 6 bulan terakhir.",
          "Notifikasi pembayaran masuk realtime via Mayar webhook.",
          "Quick action: Generate Tagihan, Catat Pembayaran, Pencairan.",
        ],
        tips: [
          "Pembayaran online via Mayar otomatis tercatat tanpa input manual.",
          "Notifikasi WA 'Pembayaran SPP Berhasil' dengan banner branded otomatis terkirim.",
        ],
      },
      {
        title: "2. Master Data Siswa",
        description:
          "Lihat seluruh data siswa beserta status SPP-nya (lunas/tunggakan/belum tagih).",
        bullets: [
          "Filter per kelas atau status pembayaran.",
          "Klik siswa untuk lihat history pembayaran SPP per bulan.",
          "Total tunggakan per siswa ditampilkan dengan badge merah.",
        ],
      },
      {
        title: "3. Tarif SPP",
        description:
          "Atur tarif SPP per kelas/jenjang. Bisa berbeda per tingkatan kelas (misal SD 100rb, SMP 150rb).",
        bullets: [
          "Tombol 'Tambah Tarif' untuk membuat tarif baru per kelas.",
          "Edit tarif kapan saja — perubahan berlaku untuk tagihan berikutnya.",
          "Tarif lama di tagihan yang sudah di-generate tidak ikut berubah.",
        ],
      },
      {
        title: "4. Generate Tagihan SPP",
        description:
          "Buat tagihan SPP massal untuk semua siswa per bulan dengan satu klik. Otomatis kirim notifikasi WA ke wali murid.",
        bullets: [
          "Pilih bulan & tahun tagihan.",
          "Pilih kelas (semua atau spesifik).",
          "Klik 'Generate' — tagihan dibuat untuk semua siswa di kelas terpilih.",
          "Notifikasi WA 'Tagihan SPP' dengan banner branded otomatis terkirim ke semua wali murid.",
          "Link pembayaran Mayar otomatis di-generate per tagihan.",
        ],
        tips: [
          "Header WhatsApp menampilkan banner 'Tagihan SPP' branded.",
          "Wali murid bisa langsung bayar via QRIS/transfer bank dari pesan WA.",
        ],
      },
      {
        title: "5. Pembayaran SPP",
        description:
          "Catat pembayaran manual (tunai) atau lihat pembayaran online yang masuk otomatis dari Mayar.",
        bullets: [
          "Tab: Belum Bayar / Sudah Bayar / Semua.",
          "Filter per bulan, kelas, atau cari nama siswa.",
          "'Catat Pembayaran Manual' untuk input pembayaran tunai/transfer manual.",
          "Pembayaran via Mayar auto-approve — tidak perlu konfirmasi manual.",
          "Bukti pembayaran (kwitansi PDF) bisa di-download per transaksi.",
        ],
        tips: [
          "Reuse pending link 5 menit terakhir — mencegah duplikat link Mayar.",
          "Notifikasi 'Pembayaran SPP Berhasil' dengan footer 'ATSkolla - Platform Digital Sekolah' otomatis terkirim.",
        ],
      },
      {
        title: "6. Import Tagihan",
        description:
          "Import tagihan SPP massal via Excel — berguna untuk migrasi data dari sistem lama.",
        bullets: [
          "Download template Excel yang disediakan.",
          "Isi: NIS, Bulan, Tahun, Nominal, Status.",
          "Upload file — sistem akan validasi & buat tagihan otomatis.",
        ],
      },
      {
        title: "7. Saldo & Riwayat",
        description:
          "Lihat saldo Mayar yang siap dicairkan dan riwayat semua transaksi masuk.",
        bullets: [
          "Saldo tersedia untuk pencairan ditampilkan paling atas.",
          "Riwayat transaksi: nama siswa, bulan, nominal, fee Mayar, net.",
          "Filter periode untuk laporan keuangan bulanan.",
        ],
      },
      {
        title: "8. Pencairan & Settlement",
        description:
          "Ajukan pencairan saldo ke rekening sekolah. Settlement otomatis diproses oleh Mayar.",
        bullets: [
          "Tombol 'Ajukan Pencairan' — pilih nominal & rekening tujuan.",
          "Status: Pending / Diproses / Selesai / Gagal.",
          "Jadwal settlement standar Mayar: H+1 hingga H+3 hari kerja.",
        ],
      },
      {
        title: "9. Laporan & Export",
        description:
          "Export laporan keuangan SPP ke Excel untuk audit atau laporan ke kepala sekolah & yayasan.",
        bullets: [
          "Pilih jenis laporan: Per Siswa / Per Kelas / Per Bulan / Konsolidasi.",
          "Filter periode (bulanan/triwulan/tahunan).",
          "Format Excel siap cetak dengan kop sekolah & tanda tangan.",
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
      "Panduan untuk Wali Murid dalam memantau kehadiran ananda melalui Portal Wali Murid (login via WhatsApp OTP) dan melakukan pembayaran SPP online.",
    steps: [
      {
        title: "1. Login Portal Wali Murid",
        description:
          "Buka halaman /parent/login lalu masukkan nomor WhatsApp yang terdaftar di sekolah ananda. Tidak perlu password.",
        image: "/panduan/parent-login.jpg",
        bullets: [
          "Pastikan nomor WA sudah didaftarkan oleh sekolah/wali kelas.",
          "Klik 'Kirim Kode OTP' — kode 6 digit dikirim via WhatsApp.",
          "Cooldown 60 detik antar permintaan OTP.",
          "Masukkan OTP — login otomatis tanpa password.",
          "Jika 1 nomor terdaftar untuk beberapa anak, akan muncul pilihan anak.",
        ],
      },
      {
        title: "2. Dashboard Wali Murid",
        description:
          "Setelah login, Anda akan melihat ringkasan kehadiran ananda hari ini, jadwal pelajaran, dan notifikasi terbaru.",
        bullets: [
          "Status kehadiran terkini: Hadir/Izin/Sakit/Alfa/Belum.",
          "Jam datang & jam pulang ananda hari ini.",
          "Statistik kehadiran bulan berjalan (persentase).",
          "Notifikasi otomatis saat ananda datang & pulang sekolah.",
          "Jadwal pelajaran ananda hari ini.",
        ],
      },
      {
        title: "3. Riwayat Kehadiran",
        description:
          "Pantau riwayat kehadiran ananda dalam bentuk kalender bulanan dan grafik tren.",
        bullets: [
          "Klik tanggal di kalender untuk lihat detail jam datang/pulang.",
          "Persentase kehadiran per bulan dalam donut chart.",
          "Tab Datang & Pulang terpisah.",
          "Histori 30/60/90 hari terakhir.",
        ],
      },
      {
        title: "4. Tagihan SPP",
        description:
          "Jika sekolah mengaktifkan modul SPP, Anda dapat melihat tagihan dan melakukan pembayaran online via QRIS/transfer bank.",
        bullets: [
          "Daftar tagihan SPP per bulan dengan status Lunas/Belum.",
          "Klik 'Bayar Sekarang' untuk pembayaran via Mayar (QRIS/Bank/E-Wallet).",
          "Notifikasi WA 'Pembayaran SPP Berhasil' dengan banner branded otomatis terkirim setelah lunas.",
          "Download kwitansi PDF setelah pembayaran berhasil.",
        ],
        tips: [
          "Pembayaran terverifikasi otomatis via webhook Mayar — saldo masuk realtime ke sekolah.",
        ],
      },
      {
        title: "5. Pengajuan Izin / Sakit",
        description:
          "Ajukan izin atau sakit untuk ananda langsung dari portal tanpa perlu datang ke sekolah.",
        bullets: [
          "Pilih tanggal (bisa range) dan jenis izin (Sakit/Izin).",
          "Tulis alasan singkat.",
          "Upload surat keterangan dokter (opsional, untuk Sakit).",
          "Wali kelas akan menerima notifikasi & approve/reject di portalnya.",
          "Notifikasi WA balasan dikirim setelah keputusan wali kelas.",
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
          Dokumentasi Resmi ATSkolla
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
          Panduan Penggunaan Lengkap
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
          Tutorial step-by-step untuk setiap peran — Admin Sekolah, Guru,
          Wali Kelas, Bendahara, dan Wali Murid.
        </p>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-4 sticky top-[57px] z-20 bg-gradient-to-b from-slate-50 to-slate-50/95 backdrop-blur pt-2 pb-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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

              {step.tips && step.tips.length > 0 && (
                <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Tips
                  </div>
                  <ul className="space-y-1.5">
                    {step.tips.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.image && (
                <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
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
            Mulai gunakan ATSkolla untuk mengelola absensi & SPP sekolah Anda.
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
