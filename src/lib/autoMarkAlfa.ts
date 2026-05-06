import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger lazy backfill auto-Alfa untuk siswa yang tidak hadir di hari sekolah lampau.
 * Aman dipanggil berulang — guard via localStorage agar maksimum 1× per hari per browser.
 */
export async function triggerAutoMarkAlfa(schoolId: string | null | undefined) {
  if (!schoolId) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `auto_alfa_last_run_${schoolId}`;
    const last = localStorage.getItem(key);
    if (last === today) return;
    // Set guard duluan supaya kalau tab dibuka 2× berbarengan tidak double trigger
    localStorage.setItem(key, today);

    await supabase.functions.invoke("auto-mark-alfa", {
      body: { school_id: schoolId },
    });
  } catch {
    // diam saja — backfill best-effort
  }
}
