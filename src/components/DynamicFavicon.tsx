import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DynamicFavicon() {
  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "favicon_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.value;
        }
      });
  }, []);

  return null;
}
