// Helper untuk rebrand URL pembayaran Mayar ke domain ATSkolla.
// URL asli tetap disimpan di DB; hanya output ke client/WA yang di-brand.
export function brandPaymentUrl(url?: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]*myr\.id/i, "https://bayar.atskolla.com");
}
