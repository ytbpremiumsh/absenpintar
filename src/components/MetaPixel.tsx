import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { callMethod?: any; queue?: any[]; loaded?: boolean; version?: string; push?: any };
    _fbq?: any;
  }
}

let initialized = false;
let currentPixelId: string | null = null;

function injectPixel(pixelId: string) {
  if (initialized && currentPixelId === pixelId) return;
  if (typeof window === "undefined") return;

  // If Pixel already initialized via index.html <head> snippet, skip re-init
  // to avoid duplicate PageView events. Just mark as initialized so SPA route
  // changes still fire PageView.
  if (window.fbq) {
    initialized = true;
    currentPixelId = pixelId;
    return;
  }

  // Standard Meta Pixel base snippet (fallback if not in index.html)
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");
  initialized = true;
  currentPixelId = pixelId;
}

export default function MetaPixel() {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["meta_pixel_enabled", "meta_pixel_id"])
      .then(({ data }) => {
        if (cancelled) return;
        const m = Object.fromEntries((data || []).map((d) => [d.key, d.value]));
        if (m.meta_pixel_enabled === "1" && m.meta_pixel_id) {
          injectPixel(m.meta_pixel_id);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Track SPA route changes as PageView
  useEffect(() => {
    if (initialized && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);

  return null;
}
