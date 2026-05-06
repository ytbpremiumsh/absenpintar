// Auto-tandai status Alfa untuk siswa yang tidak hadir di hari sekolah lampau.
// Lazy backfill — dipanggil saat user buka dashboard keesokan harinya.
// Skip akhir pekan, libur nasional, dan siswa dengan leave_request approved.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOLIDAYS = new Set<string>([
  "2025-01-01","2025-01-27","2025-01-29","2025-03-29","2025-03-31","2025-04-01",
  "2025-04-18","2025-04-20","2025-05-01","2025-05-12","2025-05-29","2025-06-01",
  "2025-06-06","2025-06-27","2025-08-17","2025-09-05","2025-12-25",
  "2026-01-01","2026-01-16","2026-02-17","2026-03-19","2026-03-20","2026-03-21",
  "2026-04-03","2026-04-05","2026-05-01","2026-05-14","2026-05-31","2026-05-27",
  "2026-06-01","2026-06-16","2026-08-17","2026-08-25","2026-12-25",
]);

const TZ_OFFSET: Record<string, number> = {
  "Asia/Jakarta": 7,
  "Asia/Makassar": 8,
  "Asia/Jayapura": 9,
};

function todayInTz(tz: string): string {
  const offset = TZ_OFFSET[tz] ?? 7;
  const now = new Date(Date.now() + offset * 3600 * 1000);
  return now.toISOString().slice(0, 10);
}

function isSchoolDay(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  if (HOLIDAYS.has(dateStr)) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { school_id } = await req.json().catch(() => ({}));
    if (!school_id) {
      return new Response(JSON.stringify({ ok: false, error: "school_id required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: school } = await supabase
      .from("schools").select("timezone").eq("id", school_id).maybeSingle();
    const tz = school?.timezone || "Asia/Jakarta";
    const today = todayInTz(tz);

    const candidates: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (isSchoolDay(ds)) candidates.push(ds);
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, dates: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: students } = await supabase
      .from("students").select("id").eq("school_id", school_id);
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, dates: candidates }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const allStudentIds = new Set(students.map((s: any) => s.id));

    let totalInserted = 0;
    const datesProcessed: { date: string; inserted: number }[] = [];

    for (const date of candidates) {
      const { count: existingAuto } = await supabase
        .from("attendance_logs")
        .select("id", { count: "exact", head: true })
        .eq("school_id", school_id).eq("date", date)
        .eq("status", "alfa").eq("recorded_by", "auto-system");
      if ((existingAuto ?? 0) > 0) continue;

      const { data: present } = await supabase
        .from("attendance_logs").select("student_id")
        .eq("school_id", school_id).eq("date", date);
      const presentIds = new Set((present || []).map((r: any) => r.student_id));

      const { data: leaves } = await supabase
        .from("parent_leave_requests").select("student_id")
        .eq("school_id", school_id).eq("date", date).eq("status", "approved");
      const excusedIds = new Set((leaves || []).map((r: any) => r.student_id));

      const toMark = [...allStudentIds].filter(
        (id) => !presentIds.has(id) && !excusedIds.has(id)
      );

      if (toMark.length > 0) {
        const rows = toMark.map((sid) => ({
          school_id,
          student_id: sid,
          date,
          time: "23:59:59",
          status: "alfa",
          attendance_type: "datang",
          method: "auto",
          recorded_by: "auto-system",
          notes: "Auto-tandai Alfa (tidak ada kehadiran sampai akhir hari)",
        }));
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabase.from("attendance_logs").insert(chunk);
          if (!error) totalInserted += chunk.length;
        }
      }
      datesProcessed.push({ date, inserted: toMark.length });
    }

    return new Response(JSON.stringify({
      ok: true,
      processed: datesProcessed.length,
      total_inserted: totalInserted,
      dates: datesProcessed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message || "unknown" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
