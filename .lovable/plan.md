# Fitur Pembayaran Offline SPP

Tujuan: Bendahara bisa mencatat pelunasan SPP yang dibayar **langsung di sekolah** (tunai / transfer manual ke rekening sekolah). Nominal tetap masuk laporan & riwayat siswa, tapi **tidak ikut dihitung sebagai saldo yang dicairkan** karena uang sudah ada di tangan sekolah.

---

## Yang Akan Dibangun

### 1. Tombol "Catat Bayar Offline" di Detail Siswa
Lokasi: `src/pages/bendahara/BendaharaPages.tsx` — komponen `BendaharaTransaksi` (Detail Siswa), kolom Aksi tabel **Riwayat Pembayaran**.

- Muncul untuk invoice berstatus `pending`, `unpaid`, atau `expired`.
- Klik → buka **Dialog Konfirmasi Pembayaran Offline** dengan:
  - Pilihan metode: **Tunai** atau **Transfer Manual ke Rekening Sekolah**
  - Input tanggal pembayaran (default: hari ini)
  - Catatan opsional (mis. nama penerima / no. referensi transfer)
  - **Banner peringatan jelas** (kuning):
    > "Pembayaran offline TIDAK masuk ke saldo pencairan online. Pastikan uang sudah benar-benar diterima sekolah sebelum mencatat. Tindakan ini tidak bisa dibatalkan otomatis."

### 2. Update Database Invoice
Saat dikonfirmasi:
```
status         = 'paid'
payment_method = 'offline_cash'  (atau) 'offline_transfer'
gateway_fee    = 0
net_amount     = 0          ← KUNCI: tidak masuk saldo cair
paid_at        = tanggal yang diinput
description    = description + " | OFFLINE: <catatan>"
```
Catatan: `total_amount` tetap utuh untuk laporan & PDF invoice. Yang di-set 0 hanya `net_amount` agar query saldo `SUM(net_amount)` otomatis mengabaikan invoice offline tanpa perlu ubah filter di banyak tempat.

### 3. Exclude Offline dari Saldo Pencairan (Defense-in-depth)
Di `BendaharaPencairan` & `BendaharaSaldo`, tambahkan filter eksplisit:
```ts
.not("payment_method", "in", "(offline_cash,offline_transfer)")
```
Jadi walau ada migrasi data lama, query saldo selalu aman.

### 4. Info Banner di Halaman Saldo & Pencairan
Banner biru kecil di atas card saldo:
> "Saldo Aktif hanya berisi pembayaran online via Mayar (QRIS / Transfer Bank / E-Wallet). Pembayaran offline (tunai / transfer manual) tidak ikut dicairkan karena uang sudah diterima sekolah secara langsung."

### 5. Format Label Metode di Tabel
Mapping tampilan kolom **Metode**:
- `offline_cash` → "Tunai (Offline)"
- `offline_transfer` → "Transfer Manual (Offline)"
- `mayar` / `qris` → "QRIS / Transfer Bank"
- lainnya → tampilkan as-is

Plus badge warna abu untuk offline agar mudah dibedakan dari pembayaran online (hijau).

### 6. PDF Invoice untuk Offline
Update `src/lib/sppInvoicePDF.ts` agar:
- Mendeteksi `payment_method` offline → tampilkan label rapi: "Tunai (Pembayaran Langsung)" atau "Transfer Manual ke Rekening Sekolah"
- Section "LUNAS / PEMBAYARAN DITERIMA" tetap muncul (karena status `paid`)
- Tambahkan note kecil di footer PDF jika offline: "Pembayaran diterima langsung oleh sekolah"

### 7. Notifikasi ke Wali Murid (Opsional, tetap aktif)
Setelah dicatat lunas offline, tampilkan tombol opsional **"Kirim Notifikasi WA Lunas"** ke wali murid dengan template:
> "Yth. Bapak/Ibu, pembayaran SPP ananda *{nama}* periode *{periode}* sebesar *{nominal}* telah kami terima secara langsung di sekolah pada {tanggal}. Terima kasih."

---

## Detail Teknis

**File yang diubah:**
- `src/pages/bendahara/BendaharaPages.tsx`
  - Tambah state `offlineDialog` di `BendaharaTransaksi`
  - Tambah fungsi `markAsPaidOffline()` & `sendOfflineWa()`
  - Tambah `<Dialog>` konfirmasi offline
  - Tambah tombol "Catat Bayar Offline" di kolom aksi (status pending/unpaid/expired)
  - Helper `formatPaymentMethod()` untuk label rapi di kolom Metode
  - Update query di `BendaharaPencairan` & `BendaharaSaldo` → exclude offline
  - Tambah info banner di kedua halaman tersebut
- `src/lib/sppInvoicePDF.ts`
  - Tambah mapping label metode offline
  - Tambah footer note untuk offline payment

**Tidak perlu migrasi DB** — kolom `payment_method` sudah ada (text), dan filter `net_amount=0` untuk saldo memanfaatkan kolom existing.

**Edge case ditangani:**
- Cegah double-click submit dialog (state `busy`)
- Cegah catat offline jika invoice sudah `paid` (button hanya muncul jika belum lunas)
- Tanggal tidak boleh > hari ini (validasi di dialog)
- Confirm dialog dengan teks "Konfirmasi" yang jelas

---

## Hasil Akhir

| Skenario | Tampilan Saldo Pencairan | Tampilan Riwayat Siswa | PDF Invoice |
|---|---|---|---|
| Bayar via Mayar (QRIS/Transfer) | ✓ Masuk saldo (net = bruto − fee) | LUNAS — QRIS / Transfer Bank | LUNAS, metode QRIS / TRF |
| Bayar offline tunai | × Tidak masuk | LUNAS — Tunai (Offline) | LUNAS, metode Tunai + footer note |
| Bayar offline transfer manual | × Tidak masuk | LUNAS — Transfer Manual (Offline) | LUNAS, metode Transfer Manual |

Bendahara bisa lanjut ajukan pencairan dana online tanpa khawatir saldo tercampur dengan uang fisik yang sudah ada di brankas sekolah.
