const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helpers — gunakan timezone sekolah (WIB/WITA/WIT) agar tidak ada miss
function getLocalParts(timezone: string, date: Date = new Date()) {
  const tz = timezone || "Asia/Jakarta";
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (t: string) => fmt.find((p) => p.type === t)?.value || "";
    const weekday = get("weekday"); // Mon, Tue, ...
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const jsDay = map[weekday] ?? new Date().getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0..Sun=6
    const hour = parseInt(get("hour"), 10);
    const minute = parseInt(get("minute"), 10);
    const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
    return { dayIdx, hour, minute, dateStr };
  } catch {
    return { dayIdx: 0, hour: 0, minute: 0, dateStr: "" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Ambil semua sekolah yang aktifkan reminder + timezone-nya
    const { data: integrations } = await supabase
      .from("school_integrations")
      .select("school_id, teaching_reminder_enabled, teaching_reminder_template, gateway_type, mpwa_api_key, mpwa_sender, api_key, api_url")
      .eq("teaching_reminder_enabled", true)
      .eq("is_active", true);

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No schools with reminder enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const schoolIds = integrations.map((i) => i.school_id);
    const { data: schools } = await supabase
      .from("schools")
      .select("id, timezone")
      .in("id", schoolIds);
    const tzMap = Object.fromEntries((schools || []).map((s) => [s.id, s.timezone || "Asia/Jakarta"]));

    const now = new Date();
    let totalSent = 0;
    let totalSkipped = 0;
    const debug: any[] = [];

    // Pre-fetch reminder yang sudah terkirim 24 jam terakhir untuk de-dupe
    const since24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const { data: sentRecent } = await supabase
      .from("whatsapp_messages")
      .select("phone, message, created_at")
      .eq("message_type", "teaching_reminder")
      .gte("created_at", since24h);

    // Proses per sekolah dengan timezone masing-masing
    for (const integration of integrations) {
      const tz = tzMap[integration.school_id] || "Asia/Jakarta";
      const { dayIdx, hour, minute, dateStr } = getLocalParts(tz, now);

      const currentMinutes = hour * 60 + minute;
      const targetMinutes = currentMinutes + 15;
      const targetHour = Math.floor(targetMinutes / 60) % 24;
      const targetMin = targetMinutes % 60;
      const HH = String(targetHour).padStart(2, "0");
      const MM = String(targetMin).padStart(2, "0");
      const MM1 = String((targetMin + 1) % 60).padStart(2, "0");
      const HH1 = targetMin + 1 >= 60 ? String((targetHour + 1) % 24).padStart(2, "0") : HH;

      console.log(`[teaching-reminder] school=${integration.school_id} tz=${tz} now=${hour}:${minute} day=${dayIdx} target=${HH}:${MM}`);

      const { data: schedules } = await supabase
        .from("teaching_schedules")
        .select("id, teacher_id, subject_id, class_id, start_time, end_time, room, school_id")
        .eq("school_id", integration.school_id)
        .eq("day_of_week", dayIdx)
        .eq("is_active", true)
        .gte("start_time", `${HH}:${MM}`)
        .lte("start_time", `${HH1}:${MM1}`);

      if (!schedules || schedules.length === 0) continue;

      const teacherIds = [...new Set(schedules.map((s) => s.teacher_id))];
      const subjectIds = [...new Set(schedules.map((s) => s.subject_id))];
      const classIds = [...new Set(schedules.map((s) => s.class_id))];

      const [teachersRes, subjectsRes, classesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, phone").in("user_id", teacherIds),
        supabase.from("subjects").select("id, name").in("id", subjectIds),
        supabase.from("classes").select("id, name").in("id", classIds),
      ]);
      const teacherMap = Object.fromEntries((teachersRes.data || []).map((t) => [t.user_id, t]));
      const subjectMap = Object.fromEntries((subjectsRes.data || []).map((s) => [s.id, s]));
      const classMap = Object.fromEntries((classesRes.data || []).map((c) => [c.id, c]));

      // De-dupe: filter sentRecent berdasarkan tanggal lokal sekolah hari ini
      const sentTodaySet = new Set(
        (sentRecent || [])
          .filter((m) => {
            const created = new Date(m.created_at);
            const localCreated = getLocalParts(tz, created).dateStr;
            return localCreated === dateStr;
          })
          .map((m) => `${m.phone}|${m.message}`)
      );

      for (const schedule of schedules) {
        const teacher = teacherMap[schedule.teacher_id];
        const subject = subjectMap[schedule.subject_id];
        const cls = classMap[schedule.class_id];
        if (!teacher?.phone) continue;

        const template = integration.teaching_reminder_template || "";
        const message = template
          .replace(/\{teacher_name\}/g, teacher.full_name || "")
          .replace(/\{subject_name\}/g, subject?.name || "")
          .replace(/\{class_name\}/g, cls?.name || "")
          .replace(/\{start_time\}/g, schedule.start_time?.slice(0, 5) || "")
          .replace(/\{end_time\}/g, schedule.end_time?.slice(0, 5) || "")
          .replace(/\{room\}/g, schedule.room || "-");

        const phone = teacher.phone.replace(/\D/g, "").replace(/^0/, "62");

        if (sentTodaySet.has(`${phone}|${message}`)) {
          totalSkipped++;
          console.log(`[teaching-reminder] skip duplicate phone=${phone} schedule=${schedule.id}`);
          continue;
        }

        try {
          const r = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              school_id: schedule.school_id,
              phone,
              message,
              message_type: "teaching_reminder",
              student_name: teacher.full_name || "",
            }),
          });
          const txt = await r.text();
          console.log(`[teaching-reminder] sent to ${phone} | ${r.status} | ${txt.substring(0, 200)}`);
          sentTodaySet.add(`${phone}|${message}`);
          totalSent++;
        } catch (e) {
          console.error("Failed to send reminder:", e);
        }
      }

      debug.push({ school_id: integration.school_id, tz, now: `${hour}:${minute}`, target: `${HH}:${MM}`, schedules: schedules.length });
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent, skipped: totalSkipped, debug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Teaching reminder error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
