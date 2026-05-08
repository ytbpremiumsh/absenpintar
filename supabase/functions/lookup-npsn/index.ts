import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const npsn = url.searchParams.get('npsn');

    if (!npsn || npsn.length !== 8 || !/^\d{8}$/.test(npsn)) {
      return new Response(JSON.stringify({ error: 'NPSN harus 8 digit angka' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try primary API
    let schoolData = null;

    try {
      const res = await fetch(`https://api.fazriansyah.eu.org/v1/sekolah?npsn=${npsn}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.satuanPendidikan) {
          const sp = json.data.satuanPendidikan;
          schoolData = {
            npsn: sp.npsn,
            name: sp.nama,
            address: sp.alamat || '',
            level: sp.jenjang || '',
            status: sp.status || '',
            district: sp.kabupatenKota || '',
            province: sp.propinsi || '',
          };
        }
      }
    } catch (e) {
      console.log('Primary API failed, trying fallback:', e.message);
    }

    // Fallback API
    if (!schoolData) {
      try {
        const res2 = await fetch(`https://dapo.kemdikbud.go.id/api/getHasilPencarian?keyword=${npsn}`);
        if (res2.ok) {
          const json2 = await res2.json();
          if (Array.isArray(json2) && json2.length > 0) {
            const s = json2[0];
            schoolData = {
              npsn: s.npsn || npsn,
              name: s.nama || s.sekolah || '',
              address: s.alamat || '',
              level: s.bentuk || '',
              status: s.status || '',
              district: s.kabupaten_kota || '',
              province: s.propinsi || '',
            };
          }
        }
      } catch (e2) {
        console.log('Fallback API also failed:', e2.message);
      }
    }

    if (!schoolData) {
      return new Response(JSON.stringify({ error: 'Sekolah dengan NPSN tersebut tidak ditemukan' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, school: schoolData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
