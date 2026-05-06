## Tujuan
Mengganti domain pada link pembayaran yang **dilihat user** (WA, email, tombol di dashboard, iframe) dari `https://ayopintarindonesia.myr.id/...` menjadi `https://bayar.atskolla.com/...` — dengan tetap mempertahankan URL asli Mayar di database supaya webhook auto-approval tidak rusak.

Asumsi: domain `bayar.atskolla.com` sudah Anda setup (Cloudflare Worker / Redirect Rule) dan sudah meneruskan ke `ayopintarindonesia.myr.id` dengan path utuh.

---

## 1. Helper baru `brandPaymentUrl()`

File: `src/lib/utils.ts` — tambahkan:
```ts
export const PAYMENT_BRAND_DOMAIN = "bayar.atskolla.com";

export function brandPaymentUrl(url?: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]*myr\.id/i, `https://${PAYMENT_BRAND_DOMAIN}`);
}
```

Helper kembar untuk edge function (Deno tidak share `src/`):  
File baru `supabase/functions/_shared/brandUrl.ts`:
```ts
export function brandPaymentUrl(url?: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]*myr\.id/i, "https://bayar.atskolla.com");
}
```

---

## 2. Terapkan di Edge Functions (output ke client/WA)

**a. `supabase/functions/spp-mayar/index.ts`**
- Saat `ensureFreshLink` mengembalikan `payment_url` ke client (line 110, 157, 254) → bungkus dengan `brandPaymentUrl(link.link)`.
- DB tetap simpan URL asli Mayar (line 238 `payment_url: link.link`) — JANGAN diubah, supaya webhook tetap bisa cocokkan via `payment_url`.

**b. `supabase/functions/create-mayar-payment/index.ts`**
- Semua `return ... payment_url: paymentLink.link` & `payment_url: existing.mayar_payment_url` → bungkus `brandPaymentUrl(...)` (≈8 lokasi).
- Field DB `mayar_payment_url` tetap URL Mayar asli.

**c. `supabase/functions/parent-portal/index.ts`** (line 483)
- `payment_url: sppJson.payment_url` → `brandPaymentUrl(sppJson.payment_url)` (jaga2 jika belum di-brand di hulu).

**d. `supabase/functions/mayar-webhook/index.ts`**
- Pesan WA "Pembayaran SPP Berhasil" tidak menyertakan link pembayaran → tidak perlu diubah.
- Logika pencocokan webhook lewat `payment_url` & `mayar_payment_url` di DB tetap pakai URL Mayar asli → AMAN.

---

## 3. Terapkan di Frontend (UI & WA)

Import: `import { brandPaymentUrl } from "@/lib/utils";`

**a. `src/pages/bendahara/BendaharaPages.tsx`**
- Line 1707 (template WA "Tagihan SPP Baru"): `${inv.payment_url}` → `${brandPaymentUrl(inv.payment_url)}`.
- Line 1720 (template Email): sama.
- Line 953 (kirim WA setelah create batch): `paymentUrl` di teks pesan → di-brand.
- Line 1446 (kirim ulang WA): sama.
- Line 1866 `copyLink(inv.payment_url)` → `copyLink(brandPaymentUrl(inv.payment_url))` (yang disalin = link branded).
- Line 1867 `setPaymentIframe(inv.payment_url)` → `setPaymentIframe(brandPaymentUrl(inv.payment_url))` (iframe load via domain branded).

**b. `src/pages/parent/ParentDashboard.tsx`** (line 166)
- `setPaymentIframe(d.payment_url)` → `setPaymentIframe(brandPaymentUrl(d.payment_url))`.

**c. `src/pages/Subscription.tsx`** (line 204), `src/pages/CustomDomain.tsx` (line 61), `src/pages/OrderIdCard.tsx` (line 139, 163), `src/pages/WaCredit.tsx` (line 77)
- Semua `setPaymentIframe(...payment_url)` → `setPaymentIframe(brandPaymentUrl(...))`.

---

## 4. QA Manual (setelah deploy)
1. Bendahara → Generate tagihan SPP → cek pesan WA: link harus `https://bayar.atskolla.com/...`.
2. Klik link di WA → harus terbuka halaman pembayaran Mayar (via redirect Worker).
3. Bayar tagihan test (nominal kecil) → webhook tetap masuk → status invoice jadi `paid` → WA konfirmasi terkirim.
4. Tombol "Buka di dashboard" di tabel invoice → iframe load via `bayar.atskolla.com`.
5. Parent dashboard → "Bayar Sekarang" → iframe juga branded.

---

## Detail Teknis Penting
- **Database tidak diubah**: kolom `payment_url` & `mayar_payment_url` tetap URL `myr.id` asli → webhook matching aman.
- **Hanya output ke user yang di-brand**: prinsip "store raw, display branded".
- **Iframe via `bayar.atskolla.com`**: bekerja selama Cloudflare Worker meneruskan path & query string utuh dengan `Location: 302` ke `myr.id`. Jika Worker pakai `fetch + return` (proxy mode) malah lebih bagus karena URL bar tetap `bayar.atskolla.com`.
- **File yang diubah**: 2 helper baru + 4 edge function + 6 page frontend. Migrasi DB: tidak ada.
