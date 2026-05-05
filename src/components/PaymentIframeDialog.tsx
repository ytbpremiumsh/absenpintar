import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface PaymentIframeDialogProps {
  open: boolean;
  paymentUrl: string | null;
  title?: string;
  onClose: () => void;
  /**
   * Async checker yang dipanggil periodik untuk cek status pembayaran.
   * Return `true` jika pembayaran sudah berhasil → dialog akan auto-close.
   */
  checkPaid?: () => Promise<boolean>;
  /** Interval polling dalam ms. Default 4000. */
  pollIntervalMs?: number;
  /** Dipanggil saat terdeteksi pembayaran berhasil (sebelum onClose). */
  onPaid?: () => void;
}

/**
 * Modal pembayaran in-dashboard.
 * Memuat halaman gateway (QRIS / Transfer Bank) di dalam iframe sehingga
 * pengguna tidak berpindah tab. Mendukung auto-close ketika pembayaran
 * berhasil — baik via postMessage dari gateway, navigasi iframe ke URL
 * sukses pada same-origin, maupun polling status melalui `checkPaid`.
 */
export const PaymentIframeDialog = ({
  open,
  paymentUrl,
  title = "Pembayaran QRIS / Transfer Bank",
  onClose,
  checkPaid,
  pollIntervalMs = 4000,
  onPaid,
}: PaymentIframeDialogProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const closedRef = useRef(false);

  const handlePaid = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    try { onPaid?.(); } catch {}
    toast.success("Pembayaran berhasil. Terima kasih!");
    onClose();
  };

  // Reset guard setiap dialog dibuka kembali
  useEffect(() => {
    if (open) closedRef.current = false;
  }, [open, paymentUrl]);

  // 1) Listener postMessage dari gateway (jika gateway mengirim event)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data) return;
      const str = typeof data === "string" ? data.toLowerCase() : "";
      const obj = typeof data === "object" ? data : {};
      const status = String(obj.status || obj.event || obj.type || "").toLowerCase();
      if (
        status.includes("paid") ||
        status.includes("success") ||
        status.includes("settle") ||
        str.includes("payment_success") ||
        str.includes("paid")
      ) {
        handlePaid();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 2) Cek navigasi iframe — kalau berpindah ke same-origin URL sukses
  useEffect(() => {
    if (!open) return;
    const onLoad = () => {
      try {
        const href = iframeRef.current?.contentWindow?.location?.href || "";
        if (/success|paid|thank|berhasil|complete/i.test(href)) handlePaid();
      } catch {
        // cross-origin → diabaikan
      }
    };
    const el = iframeRef.current;
    el?.addEventListener("load", onLoad);
    return () => el?.removeEventListener("load", onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentUrl]);

  // 3) Polling status via checker yang disediakan parent
  useEffect(() => {
    if (!open || !checkPaid) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const ok = await checkPaid();
        if (!cancelled && ok) handlePaid();
      } catch {
        // abaikan, lanjut tick berikutnya
      }
    };
    const id = window.setInterval(tick, Math.max(1500, pollIntervalMs));
    // jalankan sekali segera setelah jeda singkat
    const first = window.setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(first);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentUrl, checkPaid, pollIntervalMs]);

  if (!paymentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="flex flex-col p-0 gap-0 max-w-3xl w-[95vw] h-[88vh] overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header — compact agar tidak menutupi konten pembayaran */}
        <div className="flex h-9 items-center justify-between gap-2 border-b bg-primary px-3 text-primary-foreground shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <p className="text-xs font-semibold truncate">{title}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground text-[11px]"
              onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
              title="Buka di tab baru"
            >
              <ExternalLink className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Tab Baru</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={onClose}
              title="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <div className="min-h-0 flex-1 bg-muted/30">
          <iframe
            ref={iframeRef}
            src={paymentUrl}
            title="Halaman Pembayaran"
            className="w-full h-full border-0"
            allow="payment *; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframeDialog;
