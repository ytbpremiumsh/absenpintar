## Analisa Duplikasi Fitur per Role

Saya audit seluruh menu sidebar, mobile footer, dan dropdown header untuk 5 role aktif. Berikut temuannya — banyak entri yang **mengarah ke halaman sama** atau **fitur sangat mirip** sehingga UI terlihat ramai.

---

### 1. Role: Admin Sekolah / Operator (AppSidebar)

**Duplikasi & overlap yang ditemukan:**

| # | Item | Lokasi | Masalah |
|---|------|--------|---------|
| 1 | "Rekap Absensi" (`/export-history`) vs "Analytic Kelas" (`/history`) | Grup Laporan | Dua menu dengan data dasar sama, hanya beda tampilan tabel/chart. Bisa jadi 1 halaman dengan tab. |
| 2 | "Riwayat Absensi" (`/edit-attendance`) | Grup Laporan | Sebenarnya halaman edit, bukan laporan. Salah grup → user bingung dengan "Rekap Absensi". |
| 3 | "Jadwal Mengajar" + "Jadwal Live" | Grup Jadwal | Dua menu mirip — Jadwal Live hanya tampilan realtime dari Jadwal Mengajar. Bisa digabung jadi 1 halaman dengan toggle "Live". |
| 4 | "Wali Murid" (`/teachers`) — label menyesatkan | Grup Data Sekolah | URL `/teachers` tetapi label "Wali Murid". Membingungkan vs "Wali Kelas" + "Guru & Staff". |
| 5 | "Wali Kelas" + "Guru & Staff" | Grup Data Sekolah | Wali Kelas adalah subset Guru. 2 menu untuk objek yg sama → bisa jadi 1 halaman dengan filter role. |
| 6 | "Langganan" + "Add-on" | Grup Pengaturan | Add-on adalah bagian dari ekosistem langganan. Bisa jadi 1 halaman dengan tab "Paket" & "Add-on". |
| 7 | Mobile footer "Siswa" + sidebar "Siswa" + sidebar "Wali Murid" | Footer & sidebar | Tiga entry tentang siswa/wali. |
| 8 | Dropdown "Panduan" + "Bantuan" | Header | Dua menu support side-by-side. OK tapi bisa digabung jadi satu menu "Pusat Bantuan". |

**Total menu sidebar admin sekolah saat ini: ±20 item** (tidak termasuk Logout). Ideal: 12–14.

---

### 2. Role: Guru Mata Pelajaran (isTeacherOnly)

| # | Item | Masalah |
|---|------|---------|
| 1 | "Rekap Absensi Mapel" (`/export-history`) vs "Analytic Mapel" (`/history`) | Sama persis polanya seperti admin — 2 halaman dasar data sama. |
| 2 | Footer "Siswa" → `/wali-kelas-students` muncul **walaupun guru bukan wali kelas** | Mobile footer salah konteks — guru biasa tidak punya kelas wali. |

---

### 3. Role: Wali Kelas (muncul tambahan jika `isWaliKelas`)

Sangat ramai — 6 menu eksklusif wali kelas:
- Dashboard Kelas
- Absensi Manual
- Siswa Kelas Saya
- Rekap Absensi Kelas
- **Analytic Kelas Wali**
- Pengajuan Izin/Sakit

| # | Duplikasi |
|---|-----------|
| 1 | "Rekap Absensi Kelas" (`/wali-kelas-export`) vs "Analytic Kelas Wali" (`/wali-kelas-history`) — pola sama, gabung jadi 1. |
| 2 | Wali kelas yang juga guru mapel akan melihat **2 grup** ("Guru Mata Pelajaran" + "Wali Kelas") = total 9–10 menu, dengan 2 dashboard berbeda + 2 pasang Rekap/Analytic. **UI sangat ramai.** |
| 3 | "Dashboard Guru" + "Dashboard Kelas" — keduanya dashboard, hanya scope berbeda. Bisa jadi 1 dashboard dengan tab. |

---

### 4. Role: Bendahara (BendaharaSidebar)

Terstruktur baik (10 item, 4 grup). Hanya ada 1 catatan:

| # | Catatan |
|---|---------|
| 1 | "Saldo & Riwayat" + "Pencairan & Settlement" + "Laporan & Export" — 3 menu keuangan saling tumpang tindih konteksnya (riwayat ada di mana-mana). Konsolidasi → "Keuangan" 1 halaman dengan tab. |

---

### 5. Role: Super Admin (SuperAdminLayout)

**Sangat ramai** — 26 item menu di 7 grup. Beberapa overlap:

| # | Duplikasi |
|---|-----------|
| 1 | "Aktivasi WA Sekolah" + "Konfigurasi API WA" | Dua halaman pengaturan WhatsApp — sebaiknya 1 halaman dengan tab. |
| 2 | "Paket Langganan" + "Langganan Sekolah" + "Kelola Add-on" | Tiga menu tentang plan/subscription — bisa jadi 1 halaman tab. |
| 3 | "Branding & Landing" + "Halaman Fitur" + "Halaman Penawaran" + "Editor Panduan" + "Testimoni & Sekolah" + "Auto Caption AI" | 6 menu konten publik — bisa konsolidasi jadi "CMS Konten" dengan sub-tab. |
| 4 | "Kelola Sekolah" + "Multi Cabang" + "Log Login" | Bisa jadi 1 halaman "Sekolah" dengan tab. |
| 5 | Footer mobile super-admin "Setting" mengarah ke `/super-admin/landing` — tidak intuitif (label tidak match destinasi). |

---

### Ringkasan Rekomendasi (Skala Dampak)

**Quick wins (dampak besar, effort kecil):**
1. Gabung **Rekap Absensi + Analytic** jadi 1 halaman dengan tab (berlaku di 3 role: admin, guru, wali kelas).
2. Gabung **Langganan + Add-on** jadi 1 halaman.
3. Pindahkan **"Riwayat Absensi"** (edit) dari grup Laporan → grup khusus atau dropdown profil.
4. Gabung **Jadwal Mengajar + Jadwal Live** jadi 1 halaman dengan toggle.
5. Rename "Wali Murid" → "Orang Tua" agar tidak rancu dengan "Wali Kelas".

**Konsolidasi struktural (dampak besar, effort sedang):**
6. Super Admin: gabung 3 menu Subscription, 2 menu WA, 6 menu Konten → ±15 menu (dari 26).
7. Wali kelas + guru mapel: bikin **1 dashboard tabbed** ("Mengajar" / "Kelas Wali") menggantikan 2 dashboard terpisah.
8. Bendahara: gabung "Saldo / Pencairan / Laporan" → "Keuangan" tabbed.

**Perbaikan ringan:**
9. Mobile footer guru: ganti "Siswa" → "Riwayat" jika bukan wali kelas.
10. Dropdown header: gabung "Panduan" + "Bantuan" jadi satu submenu "Pusat Bantuan".

---

### Pertanyaan untuk User

Sebelum saya implementasi, mohon konfirmasi prioritas:

- **Opsi A** — Quick wins saja (#1–#5). Cepat, low risk, langsung terasa rapi.
- **Opsi B** — Quick wins + konsolidasi Super Admin (#1–#6). Effort sedang.
- **Opsi C** — Full restructure (#1–#10). Effort besar, hasil paling bersih, butuh adaptasi user lama.

Setelah Anda pilih, saya susun plan implementasi detail per file.
