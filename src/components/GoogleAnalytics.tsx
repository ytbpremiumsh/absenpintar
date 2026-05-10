import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let injected = false;
let measurementId: string | null = null;

export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (injected) return;
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "ga_measurement_id")
      .maybeSingle()
      .then(({ data }) => {
        const id = (data?.value as string | null)?.trim();
        if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return;
        measurementId = id;
        injected = true;

        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(s1);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", id, { send_page_view: true });
      });
  }, []);

  // Track SPA route changes
  useEffect(() => {
    if (injected && measurementId && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}
