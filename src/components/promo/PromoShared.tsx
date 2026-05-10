import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";

// Capture UTM & click IDs from URL → sessionStorage so /register can read them.
export function useUtmCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"];
    const found: Record<string, string> = {};
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) found[k] = v;
    });
    if (Object.keys(found).length > 0) {
      sessionStorage.setItem("ats_utm", JSON.stringify({ ...found, captured_at: new Date().toISOString(), landing: window.location.pathname }));
    }
  }, []);
}

export function buildRegisterUrl(extraSource: string) {
  if (typeof window === "undefined") return "/register";
  const params = new URLSearchParams(window.location.search);
  if (!params.get("utm_source")) params.set("utm_source", extraSource);
  return `/register?${params.toString()}`;
}

export function CountdownBar({ hours = 23, label = "Promo berakhir dalam" }: { hours?: number; label?: string }) {
  const [target] = useState(() => {
    const stored = sessionStorage.getItem("ats_promo_target");
    if (stored) return parseInt(stored, 10);
    const t = Date.now() + hours * 60 * 60 * 1000;
    sessionStorage.setItem("ats_promo_target", String(t));
    return t;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-2.5 px-4 text-center text-sm font-semibold flex items-center justify-center gap-3 flex-wrap">
      <span>{label}</span>
      <span className="font-mono tracking-wider bg-black/25 px-3 py-1 rounded-md tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}

export function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="font-semibold text-foreground">4.9/5</span>
        <span>dari 500+ sekolah</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>Tanpa kartu kredit</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>Aktif dalam 5 menit</span>
      </div>
    </div>
  );
}

export function StickyMobileCTA({ to, label }: { to: string; label: string }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border/60 p-3 shadow-2xl">
      <Link
        to={to}
        className="block w-full text-center bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#5B6CF9]/30 active:scale-[0.98] transition"
      >
        {label}
      </Link>
    </div>
  );
}

export function PromoFooter() {
  return (
    <footer className="py-10 px-6 border-t border-border/40 bg-muted/30">
      <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground space-y-2">
        <div className="font-bold text-foreground text-base">ATSkolla</div>
        <div>Sistem Absensi & Manajemen Sekolah Modern</div>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link to="/" className="hover:text-foreground transition">Beranda</Link>
          <Link to="/fitur" className="hover:text-foreground transition">Fitur</Link>
          <Link to="/login" className="hover:text-foreground transition">Login</Link>
          <Link to="/panduan" className="hover:text-foreground transition">Panduan</Link>
        </div>
        <div className="text-xs pt-3 opacity-70">© {new Date().getFullYear()} ATSkolla. Hak Cipta Dilindungi.</div>
      </div>
    </footer>
  );
}
