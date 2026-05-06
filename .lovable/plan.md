# Auto-Tandai Alfa Otomatis

Mengubah aturan project: status **Alfa** sekarang dapat dibuat otomatis untuk siswa yang tidak punya catatan kehadiran sama sekali di hari sekolah aktif, agar persentase kehadiran akurat.

## Perilaku

- Berlaku untuk semua metode utama: **Barcode/QR, Face Recognition, NIS, dan Absen Manual** (bukan absensi mapel).
- Eksekusi: **lazy backfill** — dijalankan saat user (admin/staff/wali kelas) membuka dashboard keesokan harinya. Tidak perlu cron.
- Cakupan: hanya siswa yang **belum punya record apa pun** (datang maupun pulang) di tanggal itu.
- Pengecualian:
  - Akhir pekan (Sabtu/Minggu) di-skip.
  - Hari libur nasional Indonesia di-skip (pakai daftar `INDONESIAN_HOLIDAYS` yang sudah ada).
  - Siswa dengan **leave_request status `approved`** untuk tanggal tersebut di-skip.
- Window backfill: 7 hari ke belakang (untuk handle kasus user tidak buka aplikasi beberapa hari).

## Komponen

### 1. Edge function baru: `auto-mark-alfa`
- File: `supabase/functions/auto-mark-alfa/index.ts`
- Config: `verify_jwt = false` (manual verification tidak diperlukan, hanya butuh `school_id`).
- Pakai `SERVICE_ROLE_KEY` untuk bypass RLS.
- Per `school_id`:
  1. Ambil timezone sekolah (WIB/WITA/WIT) → hitung "hari ini" lokal.
  2. Iterasi 1–7 hari ke belakang, filter hari sekolah (skip weekend & libur).
  3. Skip tanggal yang sudah pernah di-backfill (cek `recorded_by = 'auto-system'`).
  4. Insert batch `attendance_logs` dengan: `status='alfa'`, `time='23:59:59'`, `method='auto'`, `recorded_by='auto-system'`, `attendance_type='datang'`, notes penjelasan.
- Selalu return `200 OK` (sesuai aturan project).

### 2. Trigger dari frontend
- Tambah hook helper di `src/hooks/useAuth.tsx` atau panggil langsung di `Dashboard.tsx` & `WaliKelasDashboard.tsx` & `TeacherDashboard.tsx` saat mount, dengan guard `localStorage` (`auto_alfa_last_run_<schoolId>`) agar tidak spam — jalankan max 1× per hari per browser.

### 3. Update memori project
Ubah core memory `Attendance Logic`:
- Lama: "'Alfa' is STRICTLY manual. NEVER auto-fill"
- Baru: "Alfa di-auto-fill via lazy backfill `auto-mark-alfa` untuk siswa tanpa record di hari sekolah aktif (skip weekend/libur/leave-approved)"

## Catatan Teknis

- Tidak menyentuh `attendance_logs` schema — hanya insert baris baru.
- Insert chunk 500 baris untuk hindari payload limit.
- RLS aman karena pakai service-role.
- Halaman History/Edit yang sudah ada tetap bisa override hasil auto-Alfa secara manual (record `recorded_by='auto-system'` bukan barrier).
- Tidak akan duplikat: cek `recorded_by='auto-system'` sebelum proses tanggal.
