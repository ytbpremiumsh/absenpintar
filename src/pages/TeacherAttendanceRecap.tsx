import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, UsersRound, ArrowDownToLine, ArrowUpFromLine, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

interface TeacherRow {
  user_id: string;
  full_name: string;
  photo_url: string | null;
  roles: string[];
  days: Record<number, { datang?: string; pulang?: string }>;
  total: { H: number; A: number };
}

const TeacherAttendanceRecap = () => {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [teachers, setTeachers] = useState<{ user_id: string; full_name: string; photo_url: string | null; roles: string[] }[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"datang" | "pulang">("datang");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      if (!profile?.school_id) { setLoading(false); return; }
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const start = new Date(year, month, 1).toISOString().slice(0, 10);
        const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

        const { data: profs } = await supabase.from("profiles")
          .select("user_id, full_name, photo_url").eq("school_id", profile.school_id);
        const ids = (profs || []).map((p) => p.user_id);
        if (ids.length === 0) { setTeachers([]); setLogs([]); return; }

        const { data: rolesData } = await supabase.from("user_roles")
          .select("user_id, role").in("user_id", ids).in("role", ["teacher", "staff", "bendahara"]);
        const roleMap = new Map<string, string[]>();
        (rolesData || []).forEach((r: any) => {
          const arr = roleMap.get(r.user_id) || [];
          arr.push(r.role);
          roleMap.set(r.user_id, arr);
        });
        const filtered = (profs || []).filter((p) => roleMap.has(p.user_id))
          .map((p) => ({ ...p, roles: roleMap.get(p.user_id) || [] }));
        setTeachers(filtered);

        const { data: lgs } = await supabase.from("teacher_attendance_logs" as any)
          .select("user_id, date, time, status, attendance_type")
          .eq("school_id", profile.school_id).gte("date", start).lte("date", end);
        setLogs(lgs || []);
      } finally { setLoading(false); }
    };
    load();
  }, [profile?.school_id, currentMonth]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const dayArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => roleFilter === "all" ? true : t.roles.includes(roleFilter));
  }, [teachers, roleFilter]);

  const rows: TeacherRow[] = useMemo(() => {
    return filteredTeachers.map((t) => {
      const days: Record<number, { datang?: string; pulang?: string }> = {};
      let H = 0, A = 0;
      const myLogs = logs.filter((l) => l.user_id === t.user_id);
      for (const d of dayArray) {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dl = myLogs.find((l) => l.date === dateStr && (l.attendance_type || "datang") === "datang");
        const pl = myLogs.find((l) => l.date === dateStr && l.attendance_type === "pulang");
        days[d] = { datang: dl?.time, pulang: pl?.time };
        const target = tab === "datang" ? dl : pl;
        if (target) H++;
      }
      A = daysInMonth - H;
      return { user_id: t.user_id, full_name: t.full_name, photo_url: t.photo_url, roles: t.roles, days, total: { H, A } };
    });
  }, [filteredTeachers, logs, dayArray, currentMonth, daysInMonth, tab]);

  const exportExcel = () => {
    const header = ["Nama", "Role", ...dayArray.map((d) => String(d)), "Hadir", "Tidak"];
    const data = rows.map((r) => [
      r.full_name, r.roles.map(roleLabel).join("/"),
      ...dayArray.map((d) => {
        const t = tab === "datang" ? r.days[d]?.datang : r.days[d]?.pulang;
        return t ? t.slice(0, 5) : "-";
      }),
      r.total.H, r.total.A,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Guru");
    XLSX.writeFile(wb, `Rekap_Absensi_Guru_${MONTH_NAMES[currentMonth.getMonth()]}_${currentMonth.getFullYear()}_${tab}.xlsx`);
    toast.success("Berhasil mengunduh rekap");
  };

  const navigateMonth = (dir: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + dir);
    setCurrentMonth(d);
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] p-5 text-white shadow-xl">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <UsersRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Rekap Absensi Guru & Staff</h1>
            <p className="text-white/70 text-xs">Datang & Pulang per bulan</p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-lg rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1.5 bg-muted/50 rounded-lg flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="teacher">Guru</SelectItem>
                  <SelectItem value="staff">Operator</SelectItem>
                  <SelectItem value="bendahara">Bendahara</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportExcel} size="sm" className="h-9 rounded-lg gap-1.5 bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white">
                <Download className="h-3.5 w-3.5" /> Excel
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="datang" className="gap-1.5"><ArrowDownToLine className="h-3.5 w-3.5" />Datang</TabsTrigger>
              <TabsTrigger value="pulang" className="gap-1.5"><ArrowUpFromLine className="h-3.5 w-3.5" />Pulang</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Memuat data...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Belum ada data guru/staff</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-muted/40 z-10 min-w-[200px]">Nama</th>
                    {dayArray.map((d) => (
                      <th key={d} className="px-1.5 py-2 font-semibold w-10 text-center">{d}</th>
                    ))}
                    <th className="px-2 py-2 font-semibold text-center text-emerald-600">H</th>
                    <th className="px-2 py-2 font-semibold text-center text-red-600">A</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id} className="border-t border-border/30 hover:bg-muted/20">
                      <td className="px-3 py-2 sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={r.photo_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-[#5B6CF9]/10 text-[#5B6CF9]">{r.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground leading-tight">{r.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{r.roles.map(roleLabel).join(" • ")}</p>
                          </div>
                        </div>
                      </td>
                      {dayArray.map((d) => {
                        const t = tab === "datang" ? r.days[d]?.datang : r.days[d]?.pulang;
                        return (
                          <td key={d} className="px-1 py-2 text-center">
                            {t ? (
                              <span className="inline-block px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-semibold">{t.slice(0, 5)}</span>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-bold text-emerald-600">{r.total.H}</td>
                      <td className="px-2 py-2 text-center font-bold text-red-600">{r.total.A}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAttendanceRecap;
