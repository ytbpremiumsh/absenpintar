## Audit Bug & Kekurangan ATSkolla

Berikut hasil scan menyeluruh terhadap codebase (58 halaman, 36 edge functions). Saya kelompokkan berdasarkan **severity** dan **kategori**. Setelah Anda approve, saya akan switch ke build mode dan eksekusi fix-nya.

---

### 1. CRITICAL — Pelanggaran Core Memory

| # | Lokasi | Masalah |
|---|--------|---------|
| C1 | `supabase/functions/public-pickup/` & `src/lib/announcePickup.ts` | Masih ada terminologi **"pickup"** — melanggar Core Memory ("NEVER use pickup"). Edge function `public-pickup` masih ter-deploy. |
| C2 | 6 Edge Functions return status 4xx/5xx | `lookup-npsn`, `manage-mayar-key`, `gdrive-backup`, `referral`, `public-scan-attendance`, `seed-demo` — bisa crash frontend (Core Memory: harus selalu 200 OK). |
| C3 | 3 halaman `setLoading(true)` tanpa `try/finally` | `Login.tsx`, `ForgotPassword.tsx`, `parent/ParentLogin.tsx` — risiko **infinite loading** kalau request gagal. |

---

### 2. HIGH — Redundansi / Double Fitur

| # | Duplikasi | Detail |
|---|-----------|--------|
| H1 | **History vs ExportHistory** | `History.tsx` + `ExportHistory.tsx` dan versi wali kelas `WaliKelasHistory.tsx` + `WaliKelasExportHistory.tsx`. 4 halaman dengan logic mirip — bisa dikonsolidasi jadi 2 (admin & wali kelas) dengan tab "Lihat" dan "Export". |
| H2 | **Public Monitoring 3 versi** | `PublicMonitoring.tsx`, `PublicClassMonitoring.tsx`, `PublicAttendanceMonitoring.tsx` — overlap besar. Perlu review apakah bisa unified dengan param mode. |
| H3 | **WhatsApp Settings vs Templates** | `WhatsAppSettings.tsx` (1080 baris) sudah berisi semua template + target pengiriman. `WhatsAppTemplates.tsx` jadi redundan setelah merge "Pengingat Jadwal Mengajar" kemarin. |
| H4 | **announcePickup.ts** | Duplikat dengan `announceAttendance.ts` — fungsi serupa tapi pakai term lama. |
| H5 | **seed-demo vs seed-demo-garuda** | Dua edge function seed yang mirip — perlu konsolidasi atau hapus salah satu. |

---

### 3. MEDIUM — Bug Fungsional

| # | Lokasi | Masalah |
|---|--------|---------|
| M1 | `src/pages/Login.tsx` | Tidak ada `try/finally` di submit handler → kalau Supabase error, tombol stuck loading. |
| M2 | `mpwa-proxy/index.ts` | Tidak punya action `send` (hanya `generate-qr`, `check-status`, `disconnect`). Pengiriman WA dilakukan via `send-whatsapp` — pastikan tidak ada call lama yang masih `action: "send"` ke `mpwa-proxy`. |
| M3 | `update-user/index.ts` | Tidak verifikasi bahwa `school_admin` hanya boleh edit user di sekolahnya sendiri — potensi privilege escalation antar sekolah. |
| M4 | `verify-bendahara-otp/index.ts` | Tidak ada CORS header untuk `x-supabase-client-platform-*` (header standar lain). Bisa CORS error di sebagian environment. |
| M5 | `face-recognition` edge fn | Belum cek subscription tier di sisi server (gating hanya di frontend → bisa dibypass). |

---

### 4. MEDIUM — UX / Konsistensi

- 23 halaman `setLoading(true)` perlu audit `try/finally` (sebagian sudah aman karena pakai `await` lurus, tapi yang berisiko: `LiveSchedule`, `EditAttendance`, `TeachingSchedule`, `WaliKelasAttendance`, `WaliKelasStudents`, `WaliKelasHistory`, `WaliKelasExportHistory`, `TeacherAttendanceRecap`, `ExportHistory`, `History`, `bendahara/BendaharaPages`, `WhatsAppSettings`, beberapa SuperAdmin).
- Sebagian halaman SuperAdmin (`SuperAdminBackup`, `SuperAdminAffiliate`, `SuperAdminBendahara`, `SuperAdminPanduan`, `SuperAdminAutoCaption`, `SuperAdminLoginLogs`, `SuperAdminReferral`, `SuperAdminServerInfo`) — perlu cek loading state pattern.

---

### 5. LOW — Kebersihan

- File `src/data/mockData.ts` masih ada (sisa dev) — kemungkinan tidak terpakai di production.
- Banyak hint di komentar lama yang menyebut "pickup" perlu disisir.
- `.lovable/plan.md` sudah ada plan audit lama yang belum dijalankan.

---

## Usulan Eksekusi

Saya rekomendasikan **3 batch perbaikan** (bisa per batch approval):

**Batch A — Critical & Core Memory (cepat, low risk):**
1. Hapus edge function `public-pickup` & file `announcePickup.ts` (atau redirect ke `announceAttendance`).
2. Ubah 6 edge function ke selalu return 200 OK.
3. Tambahkan `try/finally` pada `Login`, `ForgotPassword`, `ParentLogin`.

**Batch B — Redundansi (perlu keputusan Anda):**
4. Konsolidasi History + ExportHistory (admin & wali kelas) → 2 halaman dengan tab.
5. Hapus `WhatsAppTemplates.tsx` route jika sudah tidak dipakai (atau redirect ke WhatsAppSettings).
6. Review 3 PublicMonitoring → unify atau dokumentasi alasan dipisah.
7. Konsolidasi `seed-demo` & `seed-demo-garuda`.

**Batch C — Security & UX:**
8. Tambah cek `school_id` di `update-user` (cegah cross-tenant edit).
9. Tambah subscription gating server-side di `face-recognition`.
10. Audit `try/finally` di 23 halaman loading.
11. Lengkapi CORS header `verify-bendahara-otp`.

---

### Pertanyaan untuk Anda

1. **Batch A** boleh saya jalankan langsung tanpa konfirmasi item-per-item? (semuanya jelas pelanggaran Core Memory)
2. **Batch B** — untuk konsolidasi History + Public Monitoring + WhatsAppTemplates, apakah Anda mau saya rapikan, atau biarkan terpisah karena alasan UX tertentu?
3. **Batch C** mau dijalankan sekarang atau setelah Batch A & B selesai?
