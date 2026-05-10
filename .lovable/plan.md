## Hasil Tes Langsung ke 089501123808

Saya sudah memicu `parent-portal?action=request_otp` untuk nomor tersebut:

- OTP berhasil dibuat di DB: kode **656414** pada 04:55 UTC.
- `send-whatsapp` melog status **`sent`** (message_type `parent_otp`).
- Gateway MPWA membalas: `{"status":true,"msg":"Pesan berhasil terkirim!"}`
- Nomor yang sama tetap menerima `teaching_reminder` dengan sukses ~1 jam sebelumnya.

**Artinya: kode aplikasi & integrasi MPWA sudah benar.** Jika WA tidak masuk juga, penyebabnya di luar aplikasi (sesi WA sender sekolah pending, antrean MPWA, atau pemblokiran nomor).

Yang membuat user kesulitan adalah: **semua flow OTP (parent login, lupa password admin, OTP bendahara) menggantungkan pengiriman OTP pada gateway MPWA milik sekolah**. Kalau sender sekolah down, OTP tidak akan pernah sampai walau platform MPWA punya sender cadangan yang aktif (`628886117537`).

## Rencana Perbaikan

### 1. OTP selalu pakai Platform MPWA sebagai prioritas (semua flow)
File: `supabase/functions/send-otp/index.ts`, `supabase/functions/send-bendahara-otp/index.ts`, `supabase/functions/parent-portal/index.ts`.

- Untuk semua `message_type` berbau OTP (`otp`, `parent_otp`, `bendahara_otp`), **kirim langsung via Platform MPWA sender** (`mpwa_platform_*` di `platform_settings`) terlebih dahulu.
- Jika platform sender gagal / tidak terhubung → fallback ke sender milik sekolah → fallback ke OneSender mana pun yang aktif.
- Alasan: OTP adalah pesan kritis dan tidak boleh tergantung kesehatan WA satu sekolah.

### 2. Logging lebih jujur (deteksi false-positive)
File: `supabase/functions/send-whatsapp/index.ts`

- Saat MPWA membalas `status=true` tapi `msg` mengandung kata `pending`, `queue`, `belum`, atau `not connected`, tandai log sebagai `pending` (bukan `sent`) supaya admin tahu OTP nyangkut.
- Simpan `msg` dari MPWA ke kolom message log (potong 200 char) agar bisa diaudit.

### 3. UI Parent Login lebih informatif
File: `src/pages/parent/ParentLogin.tsx`

- Setelah `request_otp` sukses, tampilkan baris kecil: "Belum dapat? Coba kirim ulang setelah 60 detik." (tombol resend sudah ada via cooldown — pastikan visible).
- Saat `verify_otp` gagal "Kode kedaluwarsa", langsung reset ke step input nomor + auto-trigger resend agar user tidak bingung.

### 4. Halaman diagnosa OTP untuk Super Admin
File baru: `src/pages/super-admin/SuperAdminWhatsAppHub.tsx` (tambah tab "OTP Logs")

- List 50 OTP terakhir (parent / admin / bendahara) dari `wa_message_logs` dengan filter `message_type IN ('otp','parent_otp','bendahara_otp')` + status + balasan MPWA.
- Tombol "Tes Kirim OTP" dengan input nomor → memanggil `send-whatsapp` via platform sender → tampilkan respons mentah.

### 5. Tidak perlu perubahan
- Schema DB tetap (`wa_message_logs.message` cukup panjang).
- Tidak ada perubahan auth, RLS, atau halaman lain.

## Detail Teknis Singkat

- Platform MPWA sender sudah aktif & terhubung (`mpwa_platform_connected=true`, sender `628886117537`, key tersimpan).
- WA add-on credit sedang **disabled** (`addon_wa_credit_enabled=false`), jadi tidak ada blocker karena saldo.
- Helper baru `sendOtpViaPlatform(phone, message)` dipakai di 3 fungsi OTP — kode dipusatkan di `_shared/sendOtp.ts` untuk menghindari duplikasi.

## Aksi yang Anda Perlu Lakukan Sekarang

1. **Cek WA 089501123808** — kode `656414` dari sender `6289605757557` seharusnya masuk (atau di antrean MPWA).
2. Konfirmasi: apakah Anda menerima OTP `teaching_reminder` hari ini di nomor itu? Kalau ya, masalahnya hanya pada delivery MPWA per-pesan, bukan setup. Rencana di atas akan menstabilkannya.
