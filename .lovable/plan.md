## Tujuan

Atur ulang akses fitur **Face Recognition** sesuai paket:
- **Premium** dan **School**: aktif
- **Trial (paket apapun)**: aktif selama masa trial — saat trial habis, otomatis kembali ke Free dan Face Recognition terkunci
- **Free / Basic**: terkunci (PremiumGate mengarahkan upgrade)

## Perubahan

### 1. `src/hooks/useSubscriptionFeatures.ts`
- Ubah `PLAN_FEATURES.School.canFaceRecognition` dari `false` → `true`.
- Tambahkan override: jika `isTrial === true` (status subscription = `trial` dan belum expired), paksa `canFaceRecognition = true` apapun nama paketnya. Trial yang sudah lewat `expires_at` sudah dipindahkan ke Free oleh logic existing — perilaku auto-downgrade tidak berubah.

### 2. `supabase/functions/public-attendance/index.ts`
Selaraskan logic backend (dipakai halaman Public Monitoring):
- Ganti `const canFaceRecognition = planName === 'Premium'` menjadi:
  - `true` jika `planName` ∈ {`School`, `Premium`}
  - **atau** `sub.status === 'trial'` dan `expires_at` masih > now
  - selain itu `false`

### 3. Halaman langganan / fitur
- `src/pages/Subscription.tsx` & `src/pages/Presentation.tsx` (kalau menampilkan matrix fitur Face Recognition): update label agar Face Recognition tercentang juga di paket School (bukan hanya Premium). Akan diperiksa & disesuaikan saat implementasi.

## Catatan
- Tidak ada perubahan database/migrasi — murni feature-flag di hook & edge function.
- Auto-downgrade trial → Free tetap berjalan via mekanisme existing (`expires_at` check di hook & `trial-check` edge fn), jadi setelah trial habis Face Recognition otomatis ikut terkunci.
- File yang menggunakan flag (`ScanQR.tsx`, `PublicAttendanceScanner.tsx`, `PublicAttendanceMonitoring.tsx`) tidak perlu diubah — mereka sudah baca `canFaceRecognition` dari hook/endpoint.