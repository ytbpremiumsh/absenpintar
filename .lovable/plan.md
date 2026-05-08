## Masalah yang Ditemukan

Dari screenshot Anda terlihat 5 reminder terkirim **setiap menit berturut-turut** (16:13, 16:14, 16:15, 16:16, 16:17) padahal tidak ada jadwal di jam tersebut. Setelah investigasi `supabase/functions/teaching-reminder/index.ts`, ada **3 bug** yang menyebabkan ini:

### Bug 1 — Timezone salah (penyebab utama "tidak ada jadwal")
Edge function pakai `now.getHours()` yang mengembalikan **jam UTC** server. Tapi `teaching_schedules.start_time` di database disimpan dalam **WIB**. Akibatnya:
- Saat jam **23:13 WIB** (= 16:13 UTC), function mencari jadwal dengan `start_time = 16:28` (UTC + 15 menit)
- Function menemukan jadwal yang sebenarnya **16:30 WIB** dan mengira itu cocok → kirim reminder
- Padahal jadwal itu masih 7+ jam lagi, bukan dalam 15 menit

### Bug 2 — Reminder dikirim berulang setiap menit
Cron berjalan tiap menit dengan window pencarian ±2 menit. Tidak ada de-dupe → jadwal yang sama tertangkap 4–5 kali berturut-turut → guru di-spam reminder.

### Bug 3 — `day_of_week` salah di sekitar tengah malam WIB
`now.getDay()` juga pakai UTC. Pukul 00:00–06:59 WIB sebenarnya masih hari sebelumnya di UTC → cron bisa baca jadwal hari yang salah.

## Rencana Perbaikan

### 1. Fix timezone — pakai waktu WIB (UTC+7) konsisten

Di `supabase/functions/teaching-reminder/index.ts`, ganti perhitungan `now`, `dayIdx`, dan `targetTime` agar selalu memakai WIB:

```ts
// Geser UTC ke WIB (UTC+7)
const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
const jsDay = wib.getUTCDay();              // pakai UTC* setelah digeser
const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
const currentMinutes = wib.getUTCHours() * 60 + wib.getUTCMinutes();
const targetMinutes = currentMinutes + 15;
```

Dengan ini, perbandingan `start_time` (yang memang WIB) menjadi benar.

### 2. Tambah de-dupe — 1 reminder per jadwal per hari

Sebelum kirim, cek tabel `whatsapp_messages` apakah pesan dengan `message_type = 'teaching_reminder'` untuk `phone` + tanggal hari ini sudah ada untuk jadwal tersebut. Karena message log tidak menyimpan `schedule_id`, pakai kombinasi: `phone + start_time + DATE(created_at WIB) = today`.

Implementasi: lakukan 1x query batch di awal:
```ts
// Ambil semua reminder yang sudah terkirim hari ini (WIB)
const todayWibStart = new Date(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate());
const startISO = new Date(todayWibStart.getTime() - 7 * 3600 * 1000).toISOString();
const { data: sentToday } = await supabase
  .from("whatsapp_messages")
  .select("phone, message")
  .eq("message_type", "teaching_reminder")
  .gte("created_at", startISO);
```
Lalu sebelum loop kirim, skip jika `phone + start_time` sudah pernah muncul di `sentToday` (cocokkan dengan substring `start_time` pada `message` karena template berisi `{start_time}`).

### 3. Perketat window pencarian (opsional, defensif)

Ubah window dari ±2 menit menjadi **tepat 15 menit dengan toleransi +0/+1 menit** — lebih kecil kemungkinannya overlap antar tick cron:

```ts
.gte("start_time", `${HH}:${MM}`)
.lte("start_time", `${HH}:${MM+1}`)
```

Kombinasi #2 + #3 membuat 1 jadwal pasti hanya menghasilkan 1 reminder per hari.

## Bagian Teknis

**File diubah:** `supabase/functions/teaching-reminder/index.ts` (1 file, ~25 baris)
**Tidak ada perubahan database** — tidak perlu migrasi, tidak perlu kolom baru.
**Cron tetap jalan tiap menit** — logika de-dupe yang menjaga agar tidak spam.

## Verifikasi setelah implementasi

1. Cek `supabase--edge_function_logs` untuk `teaching-reminder` — pastikan log menampilkan WIB time yang benar.
2. Buat 1 jadwal dummy 15 menit ke depan, tunggu, pastikan hanya **1 reminder** terkirim (bukan 4–5).
3. Cek tabel `whatsapp_messages` untuk konfirmasi tidak ada duplikat dengan `message_type = 'teaching_reminder'` di hari yang sama.

