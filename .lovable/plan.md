## Tujuan
Rapikan menu di semua role tanpa menghilangkan fitur. Setiap fitur lama tetap dapat diakses, hanya dikelompokkan ulang ke halaman bertab supaya UI lebih bersih dan tidak membingungkan.

## Prinsip
- Tidak menghapus halaman/route lama → route lama di-redirect ke halaman gabungan + tab yang sesuai (kompatibilitas bookmark, link WA, dsb).
- Penggabungan dilakukan di level halaman (Tabs), bukan menghapus komponen. Komponen halaman existing dipakai ulang sebagai konten tab.
- Sidebar & footer mobile dirapikan; dropdown profil tetap menjadi tempat aksi personal.

---

## 1. Admin Sekolah / Operator (sidebar dari ±20 → ±13 item)

### Penggabungan halaman
| Halaman baru | Tab | Sumber lama |
|---|---|---|
| `/laporan-absensi` | Rekap • Analitik • Riwayat Edit | `/export-history`, `/history`, `/edit-attendance` |
| `/jadwal` | Jadwal Mengajar • Live | `/teaching-schedule`, `/live-schedule` |
| `/langganan` | Paket • Add-on | `/subscription`, `/addons` |
| `/data-sekolah/orang-tua` (rename) | — | `/teachers` (label "Wali Murid") → "Orang Tua" |

Route lama → redirect ke tab yang benar (mis. `/export-history` → `/laporan-absensi?tab=rekap`).

### Sidebar admin sesudah konsolidasi
- Dashboard
- Monitoring
- Scan QR
- Siswa
- **Data Sekolah** (group): Kelas, Wali Kelas, Guru & Staff, Orang Tua
- Absensi Manual
- **Laporan Absensi** (1 menu, 3 tab)
- **Jadwal** (1 menu, toggle Live)
- Pengumuman Sekolah
- Pengajuan Izin/Sakit
- WhatsApp (Broadcast & History tetap)
- **Pengaturan** (group): Identitas Sekolah, Langganan & Add-on, Pengaturan WA, Backup

### Mobile footer admin: tetap (Dashboard, Monitoring, Scan, Siswa, Jadwal).

---

## 2. Guru Mata Pelajaran
- Halaman gabungan `/mapel/laporan` dengan tab Rekap • Analitik (sumber: `/export-history`, `/history` versi guru).
- Mobile footer guru (bukan wali kelas): item ke-4 berubah dari "Siswa" → **"Riwayat"** (`/mapel/laporan`). Bila user juga wali kelas, tetap "Siswa" → `/wali-kelas-students`.

---

## 3. Wali Kelas (juga sering merangkap Guru Mapel)

### Dashboard tabbed
- Halaman `/dashboard` jadi 1 dengan tab **Mengajar** dan **Kelas Wali** (muncul bila user wali kelas). Menggantikan dua dashboard terpisah.
- `/teacher-dashboard` & `/wali-kelas-dashboard` redirect ke `/dashboard?tab=mengajar|wali`.

### Laporan Wali Kelas tabbed
- Halaman `/wali-kelas/laporan` dengan tab Rekap • Analitik (sumber: `/wali-kelas-export`, `/wali-kelas-history`).

### Sidebar wali kelas (dari ~10 → 6 item)
- Dashboard (tabbed)
- Absensi Manual Kelas
- Siswa Kelas Saya
- Laporan Kelas (tabbed)
- Pengajuan Izin/Sakit
- (menu Guru Mapel tetap muncul jika user juga guru mapel, tanpa duplikasi dashboard)

---

## 4. Bendahara
Halaman gabungan `/bendahara/keuangan` dengan tab **Saldo & Riwayat • Pencairan • Laporan & Export**.
Sidebar bendahara grup "Keuangan" jadi 1 item (Keuangan), grup lainnya tetap. Total 8 item (dari 10).

---

## 5. Super Admin (sidebar dari 26 → ±15 item)

### Penggabungan
| Halaman baru | Tab | Sumber lama |
|---|---|---|
| `/super-admin/subscriptions` | Paket Langganan • Langganan Sekolah • Add-on | `super-admin/plans`, `super-admin/subscriptions`, `super-admin/addons` |
| `/super-admin/whatsapp` | Konfigurasi API • Aktivasi Sekolah | `super-admin/whatsapp`, `super-admin/registration-wa` |
| `/super-admin/cms` | Branding • Landing • Halaman Fitur • Penawaran • Panduan • Testimoni • Auto Caption | 6 menu konten terpisah |
| `/super-admin/sekolah` | Daftar Sekolah • Multi Cabang • Log Login | `super-admin/schools`, `super-admin/branches`, `super-admin/login-logs` |

Footer mobile super admin: ganti label "Setting" → "CMS" agar match destinasi `/super-admin/cms`.

---

## 6. Header Dropdown Profil (semua role)
- Gabung **Panduan + Bantuan** menjadi 1 submenu **"Pusat Bantuan"** (membuka popover dengan dua opsi: Panduan Penggunaan, Hubungi Support / Tiket).
- Tambahkan **"Riwayat Edit Absensi"** ke dropdown admin (akses cepat) — selain tab di Laporan Absensi.

---

## Catatan Teknis (untuk eksekusi)

```
Halaman bertab baru → file baru di src/pages/ yang me-render <Tabs> dan
me-mount komponen halaman lama tanpa modifikasi besar:

  /laporan-absensi  → ExportHistory + History + EditAttendance
  /jadwal           → TeachingSchedule + LiveSchedule
  /langganan        → Subscription + Addons
  /wali-kelas/laporan → WaliKelasExportHistory + WaliKelasHistory
  /mapel/laporan    → ExportHistory + History (mode guru)
  /bendahara/keuangan → Saldo + Pencairan + Laporan komponen existing
  /super-admin/subscriptions, /whatsapp, /cms, /sekolah → analog
  /dashboard tabbed  → Dashboard + WaliKelasDashboard
```

- Route lama tetap terdaftar di `App.tsx` tetapi me-render `<Navigate to="/halaman-baru?tab=…" replace />` agar tidak ada link mati.
- Sidebar (`AppSidebar`, `BendaharaSidebar`, `SuperAdminLayout`) di-edit untuk merefleksikan menu baru. Item yang digabung dihapus dari array menu.
- Dropdown profil di `AppLayout.tsx` ganti dua item (Panduan + Bantuan) jadi satu submenu "Pusat Bantuan".
- Tab aktif dibaca dari query param `?tab=...` dengan default ke tab pertama.
- Tidak ada perubahan database, edge function, atau RLS.

## Hasil yang diharapkan
- Admin Sekolah: 20 → 13 menu sidebar.
- Wali Kelas merangkap guru: 10 → 6 menu, 1 dashboard tabbed (dari 2).
- Bendahara: 10 → 8 menu.
- Super Admin: 26 → ~15 menu.
- Semua fitur tetap dapat diakses; bookmark/URL lama tetap berfungsi via redirect.
