## Tujuan
Memperbaiki seluruh notifikasi WhatsApp SPP, mengganti branding "Ayo Pintar" → "ATSkolla", mengganti label "Mayar" → "QRIS / Transfer Bank", dan mengubah seluruh halaman pembayaran agar dibuka di dalam **iframe modal** pada dashboard (bukan tab baru).

---

## 1. Perbaikan Notifikasi WhatsApp SPP

### a. Notif "Tagihan Baru" (saat bendahara generate / kirim tagihan)
File: `src/pages/bendahara/BendaharaPages.tsx` (3 lokasi: generate batch, kirim ulang, kirim WA manual)
- Rapikan template menjadi:
  ```
  *ATSkolla — Tagihan SPP Baru*
  
  Yth. Bapak/Ibu {parent_name},
  
  Tagihan SPP ananda:
  • Nama   : {student_name}
  • Kelas  : {class_name}
  • Periode: {period_label}
  • Nominal: Rp {total}
  • Jatuh tempo: {due_date}
  
  Silakan lakukan pembayaran via QRIS / Transfer Bank pada link berikut:
  {payment_url}
  
  Terima kasih.
  _ATSkolla — Sistem Absensi & SPP Sekolah_
  ```
- Hapus seluruh string "Ayo Pintar" / "(ATSkolla)" lama.

### b. Notif "Pembayaran SPP Berhasil" (otomatis dari webhook)
File: `supabase/functions/mayar-webhook/index.ts` (2 lokasi: SPP direct fallback line ~177, SPP normal line ~270)
- Template baru:
  ```
  *ATSkolla — Pembayaran SPP Berhasil ✓*
  
  Halo Ayah/Bunda {parent_name},
  
  Pembayaran SPP ananda telah kami terima:
  • Nama   : {student_name}
  • Kelas  : {class_name}
  • Periode: {period_label}
  • Nominal: Rp {total}
  • Metode : QRIS / Transfer Bank
  • Tanggal: {paid_at}
  
  Terima kasih atas kepercayaan Bapak/Ibu.
  _ATSkolla — Sistem Absensi & SPP Sekolah_
  ```
- Pastikan terkirim ke `parent_phone` via `send-whatsapp` (sudah ada, tinggal teks diperbaiki).
- Tambahkan juga notifikasi WA balasan ke **bendahara/admin sekolah** (opsional ringkas) → "Pembayaran SPP {student_name} {period_label} masuk Rp {total}".

### c. Notif tambahan: Pengiriman Sukses
- Pastikan setiap kali bendahara klik "Kirim WA" tampil toast `Notifikasi terkirim ke {parent_phone}` jika `send-whatsapp` mengembalikan sukses (sudah sebagian, dirapikan).

---

## 2. Rebranding "Ayo Pintar" & "Mayar"

### Ganti "Ayo Pintar" → "ATSkolla"
Lokasi yang harus diubah:
- `supabase/functions/spp-mayar/index.ts` line 34 (`merchantName: "Ayo Pintar"` → `"ATSkolla"`) & line 130 (test koneksi nama).
- `supabase/functions/mayar-webhook/index.ts` line 177, 270 (template WA).
- `src/pages/bendahara/BendaharaPages.tsx` line 939, 1425, 1681, 1694 (semua template WA & email).

### Ganti label "Mayar" (yang dilihat user) → "QRIS / Transfer Bank"
> Catatan: nama field internal di kode (`mayar_invoice_id`, `mayar_transaction_id`, dst.) **tidak diubah** karena itu skema database. Hanya teks user-facing.
- `src/pages/Subscription.tsx` line 201: `"Membuka halaman pembayaran Mayar..."` → `"Membuka halaman pembayaran (QRIS / Transfer Bank)..."`.
- `src/pages/bendahara/BendaharaPages.tsx` line 1110 (subtitle "membuat link Mayar dan mengirim..." → "membuat link pembayaran QRIS/Transfer dan mengirim...").
- `src/pages/super-admin/SuperAdminBendahara.tsx`, `SuperAdminPayments.tsx`, `SuperAdminSubscriptions.tsx` — cek & ganti label visible "Mayar" menjadi "QRIS / Transfer" (mis. status `payment_method: "mayar"` ditampilkan sebagai "QRIS / Transfer Bank").
- Webhook Mayar URL card di `SuperAdminPayments.tsx` tetap berjudul "Webhook Pembayaran" (bukan "Mayar Webhook URL"), tapi URL tetap.

---

## 3. Pembayaran Iframe (tidak buka tab baru)

Buat komponen baru `src/components/PaymentIframeDialog.tsx`:
- `Dialog` shadcn full-width (max-w-3xl, h-[85vh])
- Header: judul "Pembayaran QRIS / Transfer Bank" + tombol "Buka di tab baru" (fallback) + tombol close
- Body: `<iframe src={paymentUrl} className="w-full h-full rounded-lg border" allow="payment" />`
- Setelah close: panggil callback `onClose()` untuk reload data tagihan/langganan agar status terbaru ke-fetch.

Ganti seluruh `window.open(payment_url, "_blank")` → buka iframe modal:
1. `src/pages/parent/ParentDashboard.tsx` line 163 (parent bayar SPP).
2. `src/pages/Subscription.tsx` line 202 (sekolah upgrade paket).
3. `src/pages/CustomDomain.tsx` line 58 (beli custom domain add-on).
4. `src/pages/bendahara/BendaharaPages.tsx` line 1841 (tombol "Buka" di tabel invoice) — buka iframe alih-alih tab baru.
5. Add-ons lain (`Addons.tsx`, `OrderIdCard.tsx`, `WaCredit.tsx`) — cek `window.open` payment dan ganti.

> Catatan teknis: Mayar payment page mendukung dimuat di iframe (cek `X-Frame-Options`). Jika ada blokir frame untuk metode tertentu, tombol "Buka di tab baru" tetap tersedia sebagai fallback.

---

## Detail Teknis (untuk referensi)

**Files yang diubah:**
1. `supabase/functions/mayar-webhook/index.ts` — template WA SPP berhasil (×2 lokasi).
2. `supabase/functions/spp-mayar/index.ts` — `merchantName` & test name → ATSkolla.
3. `src/pages/bendahara/BendaharaPages.tsx` — template WA tagihan baru (×3), kirim email, label subtitle.
4. `src/components/PaymentIframeDialog.tsx` — **baru**, modal iframe.
5. `src/pages/parent/ParentDashboard.tsx` — pakai modal iframe untuk bayar SPP.
6. `src/pages/Subscription.tsx` — pakai modal iframe + ganti teks "Mayar".
7. `src/pages/CustomDomain.tsx`, `src/pages/Addons.tsx`, `src/pages/OrderIdCard.tsx`, `src/pages/WaCredit.tsx` — ganti `window.open` ke modal.
8. `src/pages/super-admin/SuperAdminPayments.tsx`, `SuperAdminBendahara.tsx`, `SuperAdminSubscriptions.tsx` — label visible "Mayar" → "QRIS / Transfer".

**Tidak diubah:** nama kolom DB (`mayar_*`), nama edge function (`spp-mayar`, `mayar-webhook`), endpoint Mayar API.

---

Setuju untuk saya implementasikan?