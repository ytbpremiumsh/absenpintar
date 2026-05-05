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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#5B6CF9] to-[#7B8AFF] text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{title}</p>
              <p className="text-[10px] text-white/80">Pembayaran aman — terenkripsi end-to-end</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-white hover:bg-white/15 hover:text-white text-xs"
              onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
              title="Buka di tab baru"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Tab Baru
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
              onClick={onClose}
              title="Tutup"
            >
              <X className="h-4 w-4" />
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
