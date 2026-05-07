## Plan Audit Bugs Menyeluruh — ATSkolla

Cakupan project sangat besar (58 halaman, 33 edge functions, 6+ role). Audit dipecah menjadi **5 fase berurutan**. Setelah tiap fase, saya kirim laporan temuan + rekomendasi → tunggu approval Anda → lanjut fase berikutnya.

### Temuan Awal (dari scan cepat — perlu validasi mendalam)

**Critical/High prioritas yang sudah terdeteksi:**

1. **13 Edge Functions tanpa `verify_jwt = false`** di `supabase/config.toml`:
   `affiliate, database-backup, face-recognition, gdrive-backup, lookup-npsn, public-attendance, public-monitoring, public-pickup, seed-demo, seed-demo-garuda, send-whatsapp, teaching-reminder` — beberapa harusnya public, beberapa harusnya manual-verify. Berisiko 401 error tak terduga.

2. **17 Edge Functions masih return `status 4xx/5xx`** padahal Core Memory Anda menetapkan harus selalu 200 OK. Berpotensi crash frontend (admin-approve-payment, create-user, face-recognition, mpwa-proxy, send-otp, send-whatsapp, dll).

3. **18 halaman `setLoading(true)` tanpa `try/finally`** — risiko infinite loading state (melanggar Core Memory). Antara lain: ExportHistory, EditAttendance, History, LiveSchedule, Login, ForgotPassword, TeachingSchedule, WaliKelasAttendance/Students/History/Export, beberapa Super Admin pages.

4. **`pickup` masih ada di kode** — edge function `public-pickup` & `lib/announcePickup.ts` melanggar Core Memory "NEVER use pickup".

5. **`face-recognition` edge function** belum di-update menyesuaikan gating subscription baru (perlu cek apakah sisi server sudah validasi paket).

### Fase Audit

**Fase 1 — Infrastruktur & Auth (estimasi 1 batch)**
- Edge functions: config `verify_jwt`, response 200 pattern, manual `getClaims` verification
- Auth flow: Login, Register, ForgotPassword, session management, role detection
- AppLayout, AppSidebar, routing & redirect (terutama `isTeacherOnly` logic)
- `useAuth`, `useSubscriptionFeatures` hook konsistensi

**Fase 2 — Role: Super Admin (24 halaman)**
- Schools, Plans, Subscriptions, Payments, WhatsApp, Tickets, Backup, Email, Affiliate, Bendahara, Landing, dll
- Fokus: data fetching, loading states, mutations, RLS bypass via service role

**Fase 3 — Role: School Admin / Staff (halaman utama sekolah)**
- Dashboard, Monitoring, Students, Classes, Teachers, ManageStaff/WaliKelas/Bendahara
- Subscription, SchoolSettings, WhatsAppSettings/Templates/Broadcast/History
- Addons (CustomDomain, OrderIdCard, WaCredit), Referral, Support, Panduan
- Fokus: subscription gating, capacity limits, premium gates

**Fase 4 — Role: Wali Kelas / Teacher + Bendahara + Wali Murid**
- Wali Kelas: Dashboard, Attendance, Students, History, Export, LeaveRequests, TeachingSchedule, TeacherAffiliate
- Bendahara: 11 halaman (Dashboard, Siswa, Tarif, Generate, Transaksi, ImportExport, Saldo, Pencairan, Settlement, Laporan)
- Parent: ParentLogin, ParentDashboard

**Fase 5 — Public Pages & Marketing**
- LandingPage, Presentation/fitur, Penawaran, Proposal, PitchDeck, Panduan
- PublicMonitoring, PublicClassMonitoring, PublicAttendanceMonitoring (scanner publik)
- AffiliateRegister/Login/Dashboard
- ScanQR (yang dipakai di tablet absensi)

### Metode per Fase

Untuk tiap halaman/function:
1. Baca source code
2. Cek pattern bug umum: missing `setLoading(false)`, useEffect deps, RLS, error swallowing, race condition, role check bocor
3. Cek konsistensi UI dengan Core Memory (PageHeader, no emoji, no "pickup", terminology)
4. Cek mobile responsive pada viewport 375px (lihat pb-24 padding, layout pecah)
5. Konsultasi DB query / edge function logs jika ada anomali

### Format Laporan per Fase

```text
[Severity] [Lokasi] — Deskripsi
  Reproduksi: ...
  Root cause: ...
  Fix yang diusulkan: ...
```

Severity: Critical (crash/data loss/security) / High (fitur tak jalan) / Medium (UX rusak) / Low (kosmetik)

### Workflow Approval

1. Saya jalankan Fase 1 → kirim laporan
2. Anda review & pilih bug mana yang di-fix (semua / sebagian / tunda)
3. Saya implementasi yang disetujui
4. Lanjut Fase 2, dst.

### Estimasi

5 fase × 2-3 round trip per fase = sekitar **10-15 interaksi** sampai selesai semua. Bisa lebih cepat jika Anda izinkan auto-fix Critical/High.

### Konfirmasi yang Dibutuhkan Sebelum Mulai

- **Setuju urutan 5 fase di atas?** Atau mau prioritaskan fase tertentu duluan (mis. langsung ke role yang paling banyak dipakai user)?
- **Untuk temuan awal di atas (config edge fn, response 200, infinite loading, pickup terminology)** — apakah saya boleh masukkan langsung ke perbaikan Fase 1 tanpa konfirmasi item-per-item, karena semuanya sudah jelas melanggar Core Memory yang sudah Anda tetapkan?
