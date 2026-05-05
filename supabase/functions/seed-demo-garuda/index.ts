import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const SCHOOL_NAME = 'SMA Garuda Cendikia';
    const log: string[] = [];

    // ===== Cleanup if exists =====
    const { data: existingSchool } = await supa.from('schools').select('id').eq('name', SCHOOL_NAME).maybeSingle();
    if (existingSchool) {
      // Delete users by email pattern
      const emails = ['admin.garuda@demo.id', 'bendahara.garuda@demo.id', 'guru.garuda@demo.id', 'walikelas.garuda@demo.id', 'staff.garuda@demo.id'];
      for (const em of emails) {
        const { data: u } = await supa.auth.admin.listUsers();
        const user = u?.users?.find((x: any) => x.email === em);
        if (user) await supa.auth.admin.deleteUser(user.id);
      }
      await supa.from('schools').delete().eq('id', existingSchool.id);
      log.push('Cleaned previous demo');
    }

    // ===== 1. Create School =====
    const { data: school, error: schoolErr } = await supa.from('schools').insert({
      name: SCHOOL_NAME,
      address: 'Jl. Cendekia Raya No. 1, Jakarta Selatan',
      npsn: '20100001',
      timezone: 'WIB',
    }).select().single();
    if (schoolErr) throw new Error('school: ' + schoolErr.message);
    const schoolId = school.id;
    log.push('School created: ' + schoolId);

    // ===== 2. Subscription (Premium aktif 1 tahun) =====
    const { data: premiumPlan } = await supa.from('subscription_plans').select('id').eq('name', 'Premium').maybeSingle();
    if (premiumPlan) {
      const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
      await supa.from('school_subscriptions').insert({
        school_id: schoolId, plan_id: premiumPlan.id, status: 'active', expires_at: exp.toISOString(),
      });
    }

    // ===== 3. Pickup settings + integration =====
    await supa.from('pickup_settings').insert({ school_id: schoolId, is_active: true });
    await supa.from('school_integrations').insert({
      school_id: schoolId, integration_type: 'onesender', is_active: false, wa_enabled: true,
    });

    // ===== 4. Helper: create user =====
    async function createUser(email: string, password: string, fullName: string, role: string, phone?: string) {
      const { data: u, error: ue } = await supa.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName },
      });
      if (ue) throw new Error(`user ${email}: ${ue.message}`);
      const uid = u.user.id;
      await supa.from('profiles').update({ school_id: schoolId, full_name: fullName, phone: phone || null }).eq('user_id', uid);
      await supa.from('user_roles').insert({ user_id: uid, role });
      return uid;
    }

    // ===== 5. Create users for each role =====
    const adminId = await createUser('admin.garuda@demo.id', 'demo12345', 'Bapak Hendra (Admin)', 'school_admin', '081200000001');
    const bendaharaId = await createUser('bendahara.garuda@demo.id', 'demo12345', 'Ibu Sari (Bendahara)', 'bendahara', '081200000002');
    const staffId = await createUser('staff.garuda@demo.id', 'demo12345', 'Pak Joko (Operator)', 'staff', '081200000003');
    const guruId = await createUser('guru.garuda@demo.id', 'demo12345', 'Ibu Dewi (Guru)', 'teacher', '081200000004');
    const waliKelasId = await createUser('walikelas.garuda@demo.id', 'demo12345', 'Pak Budi (Wali Kelas)', 'wali_kelas', '081200000005');
    log.push('Users created: 5');

    // ===== 6. Classes =====
    const classNames = ['X-IPA-1', 'X-IPA-2', 'XI-IPA-1', 'XI-IPS-1', 'XII-IPA-1', 'XII-IPS-1'];
    const classRows = classNames.map(n => ({ school_id: schoolId, name: n }));
    const { data: classes } = await supa.from('classes').insert(classRows).select();

    // Assign wali kelas to XI-IPA-1
    await supa.from('class_teachers').insert({ school_id: schoolId, user_id: waliKelasId, class_name: 'XI-IPA-1' });

    // ===== 7. Subjects =====
    const subjectsData = [
      { name: 'Matematika', code: 'MTK', color: '#3B82F6' },
      { name: 'Bahasa Indonesia', code: 'BIN', color: '#EF4444' },
      { name: 'Bahasa Inggris', code: 'BIG', color: '#10B981' },
      { name: 'Fisika', code: 'FIS', color: '#8B5CF6' },
      { name: 'Kimia', code: 'KIM', color: '#F59E0B' },
      { name: 'Biologi', code: 'BIO', color: '#06B6D4' },
      { name: 'Sejarah', code: 'SEJ', color: '#EC4899' },
    ];
    const { data: subjects } = await supa.from('subjects').insert(
      subjectsData.map(s => ({ ...s, school_id: schoolId }))
    ).select();

    // ===== 8. Students (30 siswa, distribusi ke kelas) =====
    const firstNames = ['Ahmad', 'Siti', 'Muhammad', 'Putri', 'Rafi', 'Anisa', 'Dimas', 'Zahra', 'Farhan', 'Nabila',
      'Rizky', 'Aisha', 'Bayu', 'Cantika', 'Galih', 'Halimah', 'Irfan', 'Jasmine', 'Kevin', 'Lintang',
      'Mario', 'Nadia', 'Oscar', 'Putu', 'Qori', 'Reza', 'Salsa', 'Tegar', 'Umar', 'Vanya'];
    const lastNames = ['Pratama', 'Nurhaliza', 'Rizki', 'Ayu', 'Hidayat', 'Rahma', 'Aditya', 'Putri', 'Maulana', 'Azzahra',
      'Ramadhan', 'Zahra', 'Saputra', 'Dewi', 'Pramono', 'Tusadiah', 'Hakim', 'Sari', 'Kurniawan', 'Wijaya',
      'Setiawan', 'Lestari', 'Pranoto', 'Anggraini', 'Salim', 'Firmansyah', 'Ningrum', 'Pamungkas', 'Hasan', 'Amelia'];
    const parentNames = ['Budi Santoso', 'Hendra Wijaya', 'Andi Pratama', 'Dewi Lestari', 'Joko Widodo', 'Sri Mulyani', 'Bambang S', 'Ratna Sari', 'Agus Hermawan', 'Yuni Astuti'];

    const students: any[] = [];
    for (let i = 0; i < 30; i++) {
      const cls = classNames[i % classNames.length];
      const gender = i % 2 === 0 ? 'L' : 'P';
      const sid = `2024${String(i + 1).padStart(4, '0')}`;
      students.push({
        school_id: schoolId,
        name: `${firstNames[i]} ${lastNames[i]}`,
        class: cls,
        student_id: sid,
        parent_name: parentNames[i % parentNames.length],
        parent_phone: `0812${String(34567890 + i).padStart(8, '0')}`,
        qr_code: `QR-${sid}`,
        gender,
      });
    }
    const { data: studentsCreated, error: stuErr } = await supa.from('students').insert(students).select();
    if (stuErr) throw new Error('students: ' + stuErr.message);
    log.push(`Students: ${studentsCreated?.length}`);

    // ===== 9. Attendance logs (7 hari terakhir, ~80% hadir) =====
    const attLogs: any[] = [];
    const today = new Date();
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today); dt.setDate(today.getDate() - d);
      const dow = dt.getDay();
      if (dow === 0) continue; // Minggu skip
      const dateStr = dt.toISOString().split('T')[0];
      for (const s of (studentsCreated || [])) {
        if (Math.random() < 0.85) {
          const hour = 6 + Math.floor(Math.random() * 2);
          const min = Math.floor(Math.random() * 60);
          attLogs.push({
            school_id: schoolId, student_id: s.id, date: dateStr,
            time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
            method: ['barcode', 'manual', 'face'][Math.floor(Math.random() * 3)],
            status: 'hadir', attendance_type: 'datang',
          });
          if (Math.random() < 0.7) {
            attLogs.push({
              school_id: schoolId, student_id: s.id, date: dateStr,
              time: `${14 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
              method: 'barcode', status: 'hadir', attendance_type: 'pulang',
            });
          }
        } else if (Math.random() < 0.5) {
          // Sakit/Izin
          attLogs.push({
            school_id: schoolId, student_id: s.id, date: dateStr,
            time: '07:00:00', method: 'manual',
            status: Math.random() < 0.5 ? 'sakit' : 'izin', attendance_type: 'datang',
          });
        }
      }
    }
    if (attLogs.length) {
      // batch insert
      for (let i = 0; i < attLogs.length; i += 500) {
        await supa.from('attendance_logs').insert(attLogs.slice(i, i + 500));
      }
    }
    log.push(`Attendance logs: ${attLogs.length}`);

    // ===== 10. Teaching schedules (untuk guru) =====
    if (subjects && classes) {
      const xiIpa1 = classes.find((c: any) => c.name === 'XI-IPA-1');
      const xIpa1 = classes.find((c: any) => c.name === 'X-IPA-1');
      const mtk = subjects.find((s: any) => s.code === 'MTK');
      const fis = subjects.find((s: any) => s.code === 'FIS');
      if (xiIpa1 && mtk) {
        await supa.from('teaching_schedules').insert([
          { school_id: schoolId, teacher_id: guruId, subject_id: mtk.id, class_id: xiIpa1.id, day_of_week: 1, start_time: '07:30', end_time: '09:00', room: 'R-201' },
          { school_id: schoolId, teacher_id: guruId, subject_id: mtk.id, class_id: xiIpa1.id, day_of_week: 3, start_time: '09:30', end_time: '11:00', room: 'R-201' },
          { school_id: schoolId, teacher_id: guruId, subject_id: fis?.id || mtk.id, class_id: xIpa1?.id || xiIpa1.id, day_of_week: 2, start_time: '10:00', end_time: '11:30', room: 'Lab-Fis' },
        ]);
      }
    }

    // ===== 11. SPP Invoices (3 bulan: 2 lunas, 1 belum) =====
    const sppRows: any[] = [];
    const months = [
      { m: today.getMonth() - 1, y: today.getFullYear(), status: 'paid' },
      { m: today.getMonth(), y: today.getFullYear(), status: 'paid' },
      { m: today.getMonth() + 1, y: today.getFullYear(), status: 'pending' },
    ];
    const monthLabels = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let invNo = 1;
    for (const s of (studentsCreated || []).slice(0, 20)) {
      for (const period of months) {
        const mm = ((period.m % 12) + 12) % 12;
        const due = new Date(period.y, mm, 10);
        sppRows.push({
          school_id: schoolId, student_id: s.id,
          invoice_number: `INV-GRD-${String(invNo++).padStart(5, '0')}`,
          student_name: s.name, class_name: s.class,
          parent_name: s.parent_name, parent_phone: s.parent_phone,
          period_month: mm + 1, period_year: period.y,
          period_label: `${monthLabels[mm]} ${period.y}`,
          description: `SPP ${monthLabels[mm]} ${period.y}`,
          amount: 350000, denda: 0, total_amount: 350000, gateway_fee: 0, net_amount: 350000,
          due_date: due.toISOString().split('T')[0],
          status: period.status,
          paid_at: period.status === 'paid' ? new Date(period.y, mm, 5).toISOString() : null,
          payment_method: period.status === 'paid' ? 'qris' : null,
        });
      }
    }
    for (let i = 0; i < sppRows.length; i += 200) {
      await supa.from('spp_invoices').insert(sppRows.slice(i, i + 200));
    }
    log.push(`SPP invoices: ${sppRows.length}`);

    // ===== 12. School announcements =====
    await supa.from('school_announcements').insert([
      { school_id: schoolId, title: 'Selamat Datang di ATSkolla', message: 'Sistem absensi dan administrasi digital SMA Garuda Cendikia telah aktif.', type: 'info', is_pinned: true, target_audience: 'all', created_by: adminId },
      { school_id: schoolId, title: 'Ujian Tengah Semester', message: 'UTS akan dilaksanakan minggu depan. Mohon persiapan siswa.', type: 'warning', target_audience: 'all', created_by: adminId },
    ]);

    return new Response(JSON.stringify({
      success: true,
      school_id: schoolId,
      log,
      credentials: {
        school_admin: { email: 'admin.garuda@demo.id', password: 'demo12345', name: 'Bapak Hendra' },
        bendahara: { email: 'bendahara.garuda@demo.id', password: 'demo12345', name: 'Ibu Sari' },
        staff: { email: 'staff.garuda@demo.id', password: 'demo12345', name: 'Pak Joko' },
        teacher: { email: 'guru.garuda@demo.id', password: 'demo12345', name: 'Ibu Dewi' },
        wali_kelas: { email: 'walikelas.garuda@demo.id', password: 'demo12345', name: 'Pak Budi (XI-IPA-1)' },
        parent_portal: { phone: students[0].parent_phone, student_id: students[0].student_id, note: 'Login orang tua via OTP WA atau gunakan no HP siswa pertama' },
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
