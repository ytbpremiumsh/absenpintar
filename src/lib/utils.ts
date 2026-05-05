import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAYMENT_BRAND_DOMAIN = "bayar.atskolla.com";

/**
 * Mengubah link Mayar (myr.id) menjadi domain branded ATSkolla.
 * URL asli tetap disimpan di DB; hanya tampilan ke user yang di-brand.
 */
export function brandPaymentUrl(url?: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]*myr\.id/i, `https://${PAYMENT_BRAND_DOMAIN}`);
}
