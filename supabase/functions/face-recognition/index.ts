import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { captured_image, school_id } = await req.json();
    if (!captured_image || !school_id) {
      return new Response(JSON.stringify({ success: false, error: "captured_image dan school_id wajib diisi" }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Server-side subscription gating: only School/Premium plans (or any active trial) may use Face Recognition
    const { data: sub } = await supabaseAdmin
      .from("school_subscriptions")
      .select("status, expires_at, subscription_plans(name)")
      .eq("school_id", school_id)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const planName = (sub as any)?.subscription_plans?.name || "Free";
    const isTrial = sub?.status === "trial";
    const notExpired = sub?.expires_at ? new Date(sub.expires_at) > new Date() : false;
    const allowedPlan = ["School", "Premium"].includes(planName);
    const allowed = (isTrial && notExpired) || (allowedPlan && notExpired);

    if (!allowed) {
      return new Response(JSON.stringify({
        success: false,
        match: false,
        error: "Face Recognition hanya tersedia untuk paket School, Premium, atau Trial aktif. Silakan upgrade paket Anda.",
        code: "PLAN_REQUIRED",
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, student_id, class, photo_url, parent_name, parent_phone')
      .eq('school_id', school_id)
      .not('photo_url', 'is', null);

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ success: false, match: false, error: "Tidak ada siswa dengan foto di sekolah ini" }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build image content for AI - send captured image + up to 20 student photos
    const studentBatch = students.slice(0, 20);
    
    const studentList = studentBatch.map((s, i) => 
      `Student #${i + 1}: Name="${s.name}", ID="${s.student_id}", Class="${s.class}"`
    ).join('\n');

    const imageContent: any[] = [
      {
        type: "text",
        text: `You are a face recognition system for a school attendance app. 
Compare the FIRST image (captured from camera) with the subsequent student photos.

Your task: Determine which student (if any) matches the face in the captured image.

Student list:
${studentList}

The images follow in order: first is the captured image, then student photos in order (#1, #2, etc.).

IMPORTANT: 
- If you find a match, respond ONLY with the JSON: {"match": true, "student_index": <number>}
- If no match is found, respond ONLY with: {"match": false}
- student_index is 1-based (first student = 1)
- Be reasonably lenient - same person with slightly different angle/lighting should match
- Do NOT include any other text, only the JSON`
      },
      {
        type: "image_url",
        image_url: { url: captured_image }
      }
    ];

    // Add student photos
    for (const student of studentBatch) {
      if (student.photo_url) {
        imageContent.push({
          type: "image_url",
          image_url: { url: student.photo_url }
        });
      }
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: imageContent }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, match: false, error: "Terlalu banyak permintaan, coba lagi nanti" }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, match: false, error: "Kredit AI habis" }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ success: true, match: false, error: "Could not parse AI response" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    if (result.match && result.student_index) {
      const matchedStudent = studentBatch[result.student_index - 1];
      if (matchedStudent) {
        return new Response(JSON.stringify({
          success: true,
          match: true,
          student: {
            id: matchedStudent.id,
            name: matchedStudent.name,
            student_id: matchedStudent.student_id,
            class: matchedStudent.class,
            photo_url: matchedStudent.photo_url,
            parent_name: matchedStudent.parent_name,
            parent_phone: matchedStudent.parent_phone,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, match: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Face recognition error:", error);
    return new Response(JSON.stringify({ success: false, match: false, error: error.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
