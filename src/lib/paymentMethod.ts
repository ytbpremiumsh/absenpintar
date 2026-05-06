// Helper bersama untuk format payment_method jadi label rapi (UI & export)
export const formatPaymentMethodLabel = (m?: string | null): string => {
  const v = (m || "").toLowerCase();
  if (v === "offline_cash") return "TUNAI (OFFLINE)";
  if (v === "offline_transfer") return "Transfer Manual ke Rekening";
  if (v === "qris") return "QRIS";
  if (v === "wa_credit" || v.includes("wa_credit")) return "Kredit WA";
  if (v.includes("transfer") || v.includes("bank")) return "Transfer Bank";
  if (v === "mayar" || v === "spp" || v === "" || !v) return "QRIS / Transfer Bank";
  return m || "-";
};
