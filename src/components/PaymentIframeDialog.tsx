import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, ShieldCheck } from "lucide-react";

interface PaymentIframeDialogProps {
  open: boolean;
  paymentUrl: string | null;
  title?: string;
  onClose: () => void;
}

/**
 * Modal pembayaran in-dashboard.
 * Memuat halaman gateway (QRIS / Transfer Bank) di dalam iframe sehingga
 * pengguna tidak berpindah tab. Tetap menyediakan tombol "Buka di tab baru"
 * sebagai fallback bila gateway memblokir frame embedding.
 */
export const PaymentIframeDialog = ({ open, paymentUrl, title = "Pembayaran QRIS / Transfer Bank", onClose }: PaymentIframeDialogProps) => {
  if (!paymentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 gap-0 max-w-3xl w-[95vw] h-[88vh] overflow-hidden rounded-2xl border-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header — compact agar tidak menutupi konten pembayaran */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-gradient-to-r from-[#5B6CF9] to-[#7B8AFF] text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <p className="text-xs font-semibold truncate">{title}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-white hover:bg-white/15 hover:text-white text-[11px]"
              onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
              title="Buka di tab baru"
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Tab Baru
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/15 hover:text-white"
              onClick={onClose}
              title="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 bg-muted/30 h-full">
          <iframe
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
