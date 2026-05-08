const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Convert to WIB (UTC+7) — server runs in UTC but schedules are stored in WIB
    const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const jsDay = wib.getUTCDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;

    const currentMinutes = wib.getUTCHours() * 60 + wib.getUTCMinutes();
    const targetMinutes = currentMinutes + 15;

    const targetHour = Math.floor(targetMinutes / 60) % 24;
    const targetMin = targetMinutes % 60;
    const HH = String(targetHour).padStart(2, "0");
    const MM = String(targetMin).padStart(2, "0");
    const MM1 = String((targetMin + 1) % 60).padStart(2, "0");
    const HH1 = targetMin + 1 >= 60 ? String((targetHour + 1) % 24).padStart(2, "0") : HH;

    console.log(`[teaching-reminder] WIB now=${HH}:${MM} (day=${dayIdx}) looking for start_time ${HH}:${MM}..${HH1}:${MM1}`);

    // Tight window: only schedules at exactly target minute (+1 tolerance for cron drift)
    const { data: schedules } = await supabase
      .from("teaching_schedules")
      .select("id, teacher_id, subject_id, class_id, start_time, end_time, room, school_id")
      .eq("day_of_week", dayIdx)
      .eq("is_active", true)
      .gte("start_time", `${HH}:${MM}`)
      .lte("start_time", `${HH1}:${MM1}`);

    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No schedules to remind" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const schoolIds = [...new Set(schedules.map((s) => s.school_id))];

    const { data: integrations } = await supabase
      .from("school_integrations")
      .select("school_id, teaching_reminder_enabled, teaching_reminder_template, gateway_type, mpwa_api_key, mpwa_sender, api_key, api_url")
      .in("school_id", schoolIds)
      .eq("teaching_reminder_enabled", true)
      .eq("is_active", true);

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No schools with reminder enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enabledSchoolIds = integrations.map((i) => i.school_id);
    const relevantSchedules = schedules.filter((s) => enabledSchoolIds.includes(s.school_id));

    // De-dupe: fetch reminders already sent today (WIB)
    const wibMidnightUtcMs = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600 * 1000;
    const startISO = new Date(wibMidnightUtcMs).toISOString();
    const { data: sentToday } = await supabase
      .from("whatsapp_messages")
      .select("phone, message")
      .eq("message_type", "teaching_reminder")
      .gte("created_at", startISO);

    const sentSet = new Set((sentToday || []).map((m) => `${m.phone}|${m.message}`));

    const teacherIds = [...new Set(relevantSchedules.map((s) => s.teacher_id))];
    const subjectIds = [...new Set(relevantSchedules.map((s) => s.subject_id))];
    const classIds = [...new Set(relevantSchedules.map((s) => s.class_id))];

    const [teachersRes, subjectsRes, classesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone").in("user_id", teacherIds),
      supabase.from("subjects").select("id, name").in("id", subjectIds),
      supabase.from("classes").select("id, name").in("id", classIds),
    ]);

    const teacherMap = Object.fromEntries((teachersRes.data || []).map((t) => [t.user_id, t]));
    const subjectMap = Object.fromEntries((subjectsRes.data || []).map((s) => [s.id, s]));
    const classMap = Object.fromEntries((classesRes.data || []).map((c) => [c.id, c]));
    const integrationMap = Object.fromEntries(integrations.map((i) => [i.school_id, i]));

    let sent = 0;
    let skipped = 0;
    for (const schedule of relevantSchedules) {
      const teacher = teacherMap[schedule.teacher_id];
      const subject = subjectMap[schedule.subject_id];
      const cls = classMap[schedule.class_id];
      const integration = integrationMap[schedule.school_id];

      if (!teacher?.phone || !integration) continue;

      const template = integration.teaching_reminder_template || "";
      const message = template
        .replace(/\{teacher_name\}/g, teacher.full_name || "")
        .replace(/\{subject_name\}/g, subject?.name || "")
        .replace(/\{class_name\}/g, cls?.name || "")
        .replace(/\{start_time\}/g, schedule.start_time?.slice(0, 5) || "")
        .replace(/\{end_time\}/g, schedule.end_time?.slice(0, 5) || "")
        .replace(/\{room\}/g, schedule.room || "-");

      const phone = teacher.phone.replace(/\D/g, "").replace(/^0/, "62");

      // De-dupe: skip if already sent today with same phone+message
      if (sentSet.has(`${phone}|${message}`)) {
        skipped++;
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
        sentSet.add(`${phone}|${message}`); // prevent same-tick dup if multiple schedules collide
        sent++;
      } catch (e) {
        console.error("Failed to send reminder:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent, skipped, total: relevantSchedules.length }), {
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
