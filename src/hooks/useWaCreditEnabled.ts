import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the WA Credit add-on/feature is enabled platform-wide.
 * Controlled by `platform_settings.addon_wa_credit_enabled` from Super Admin.
 * Default: enabled (true) when setting is missing.
 */
export function useWaCreditEnabled() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "addon_wa_credit_enabled")
        .maybeSingle();
      if (cancelled) return;
      setEnabled(!data || data.value !== "false");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, loading };
}
