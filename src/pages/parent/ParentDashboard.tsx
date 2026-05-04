import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, LogOut, GraduationCap, CalendarDays, Megaphone, FileText,
  Phone, ClipboardList, BookOpen, CheckCircle2, XCircle, Clock,
  Sparkles, TrendingUp, Pin, Paperclip, MessageCircle, User, MapPin, Bell,
  Wallet, AlertCircle, Download, ExternalLink, RefreshCw, Receipt, MoreHorizontal,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { downloadSppInvoicePDF } from "@/lib/sppInvoicePDF";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  hadir: "#10b981",
  izin: "#f59e0b",
  sakit: "#0ea5e9",
  alfa: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alfa: "Alfa" };

function buildChartData(attendance: any[], period: "day" | "week" | "month") {
  const buckets: { key: string; name: string; date: Date }[] = [];
  const now = new Date();
  if (period === "day") {
    // jam 06-18 tiap 2 jam
    for (let h = 6; h <= 18; h += 2) {
      const d = new Date(now); d.setHours(h, 0, 0, 0);
      buckets.push({ key: `${d.toISOString().slice(0,10)}-${h}`, name: `${String(h).padStart(2,"0")}:00`, date: d });
    }
  } else {
    const days = period === "week" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        name: period === "week"
          ? d.toLocaleDateString("id-ID", { weekday: "short" })
          : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        date: d,
      });
    }
  }
  return buckets.map((b) => {
    const counts: any = { name: b.name, hadir: 0, izin: 0, sakit: 0, alfa: 0 };
    if (period === "day") {
      const dayKey = now.toISOString().slice(0, 10);
      attendance.forEach((a) => {
        if (a.date !== dayKey) return;
        const hh = parseInt((a.time || "00:00").slice(0, 2), 10);
        if (hh >= b.date.getHours() && hh < b.date.getHours() + 2) counts[a.status] = (counts[a.status] || 0) + 1;
      });
    } else {
      const dayKey = b.date.toISOString().slice(0, 10);
      attendance.forEach((a) => { if (a.date === dayKey) counts[a.status] = (counts[a.status] || 0) + 1; });
    }
    return counts;
  });
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  hadir: { label: "Hadir", cls: "bg-emerald-500 text-white" },
  izin: { label: "Izin", cls: "bg-amber-500 text-white" },
  sakit: { label: "Sakit", cls: "bg-sky-500 text-white" },
  alfa: { label: "Alfa", cls: "bg-red-500 text-white" },
};

const PRIMARY_TABS = [
  { id: "home", label: "Beranda", icon: Sparkles },
  { id: "attendance", label: "Absensi", icon: ClipboardList },
  { id: "spp", label: "SPP", icon: Wallet },
  { id: "schedule", label: "Jadwal", icon: CalendarDays },
];

const MORE_TABS = [
  { id: "info", label: "Pengumuman", icon: Megaphone, desc: "Info & berita sekolah" },
  { id: "leave", label: "Pengajuan Izin", icon: FileText, desc: "Ajukan izin/sakit" },
  { id: "contact", label: "Kontak Wali Kelas", icon: Phone, desc: "Hubungi guru" },
];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("parent_token") || "");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");

  const [attendance, setAttendance] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [homeroom, setHomeroom] = useState<any>(null);
  const [statPeriod, setStatPeriod] = useState<"day" | "week" | "month">("week");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sppData, setSppData] = useState<{ aktif: any[]; tunggakan: any[]; lunas: any[]; total_tunggakan: number }>({ aktif: [], tunggakan: [], lunas: [], total_tunggakan: 0 });
  const [sppBusy, setSppBusy] = useState<string | null>(null);

  const [leaveForm, setLeaveForm] = useState<{ type: string; date: string; reason: string; attachment_url: string | null }>({ type: "izin", date: new Date().toISOString().slice(0, 10), reason: "", attachment_url: null });

  const invoke = useCallback(async (action: string, body: any = {}) => {
    const res = await fetch(`https://bohuglednqirnaearrkj.supabase.co/functions/v1/parent-portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-parent-token": token },
      body: JSON.stringify({ action, ...body }),
    });
    return res.json();
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/parent/login"); return; }
    invoke("me").then((d) => {
      if (d?.code === "UNAUTH") { localStorage.removeItem("parent_token"); navigate("/parent/login"); return; }
      setStudents(d.students || []);
      if (d.students?.length) setSelectedStudent(d.students[0].id);
      setLoading(false);
    });
  }, [token, invoke, navigate]);

  const loadTab = useCallback(async () => {
    if (!selectedStudent) return;
    const body = { student_id: selectedStudent };
    if (tab === "home") {
      const [a, s, n] = await Promise.all([
        invoke("attendance", body),
        invoke("schedule", body),
        invoke("announcements", body),
      ]);
      setAttendance(a.attendance || []);
      setSchedule(s.schedule || []);
      setAnnouncements(n.announcements || []);
    } else if (tab === "attendance") {
      const d = await invoke("attendance", body); setAttendance(d.attendance || []);
    } else if (tab === "schedule") {
      const d = await invoke("schedule", body); setSchedule(d.schedule || []);
    } else if (tab === "info") {
      const d = await invoke("announcements", body); setAnnouncements(d.announcements || []);
    } else if (tab === "leave") {
      const d = await invoke("list_leaves", body); setLeaves(d.leaves || []);
    } else if (tab === "contact") {
      const d = await invoke("homeroom", body); setHomeroom(d);
    } else if (tab === "spp") {
      const d = await invoke("spp_list", body);
      setSppData({ aktif: d.aktif || [], tunggakan: d.tunggakan || [], lunas: d.lunas || [], total_tunggakan: d.total_tunggakan || 0 });
    }
  }, [tab, selectedStudent, invoke]);

  const paySpp = async (invoiceId: string) => {
    setSppBusy(invoiceId);
    const d = await invoke("spp_pay", { student_id: selectedStudent, invoice_id: invoiceId });
    setSppBusy(null);
    if (d?.error) { toast.error(d.error); return; }
    if (d?.payment_url) { window.open(d.payment_url, "_blank"); toast.success("Membuka halaman pembayaran..."); loadTab(); }
  };

  const downloadSppPdf = async (inv: any) => {
    setSppBusy(`pdf-${inv.id}`);
    try {
      const sch = await invoke("school_info", { student_id: selectedStudent });
      await downloadSppInvoicePDF({
        invoice: inv,
        student: { student_id: current?.student_id, parent_name: current?.parent_name },
        school: sch?.school || { name: "Sekolah" },
      });
      toast.success("Invoice diunduh");
    } catch (e: any) { toast.error(e.message || "Gagal"); }
    finally { setSppBusy(null); }
  };

  useEffect(() => { loadTab(); }, [loadTab]);

  const logout = async () => {
    await invoke("logout");
    localStorage.removeItem("parent_token");
    localStorage.removeItem("parent_phone");
    navigate("/parent/login");
  };

  const submitLeave = async () => {
    if (!leaveForm.reason.trim()) return toast.error("Alasan wajib diisi");
    const d = await invoke("submit_leave", { student_id: selectedStudent, ...leaveForm });
    if (d?.error) return toast.error(d.error);
    toast.success("Pengajuan terkirim, menunggu persetujuan wali kelas");
    setLeaveForm({ type: "izin", date: new Date().toISOString().slice(0, 10), reason: "", attachment_url: null });
    loadTab();
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Maks 5MB");
    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedStudent}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("parent-attachments").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("parent-attachments").getPublicUrl(path);
      setLeaveForm((f) => ({ ...f, attachment_url: data.publicUrl }));
      toast.success("Lampiran terupload");
    } catch (e: any) {
      toast.error(e.message || "Gagal upload");
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#5B6CF9]" /></div>;

  if (students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="text-sm text-muted-foreground mb-4">Tidak ada data siswa terhubung dengan nomor Anda.</p>
          <Button onClick={logout} variant="outline">Keluar</Button>
        </Card>
      </div>
    );
  }

  const current = students.find((s) => s.id === selectedStudent);


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5B6CF9]/5 via-background to-background pb-28">
      {/* Glass Header */}
      <div className="relative bg-gradient-to-br from-[#5B6CF9] via-[#5B6CF9] to-[#4c5ded] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 0%, white 1px, transparent 1px), radial-gradient(circle at 80% 100%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 ring-1 ring-white/30">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-medium">Wali Murid</p>
                <h1 className="text-sm sm:text-base font-bold truncate">{current?.schools?.name || "Sekolah"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setTab("info")} className="relative h-9 w-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors" aria-label="Notifikasi">
                <Bell className="h-4 w-4" />
                {announcements.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-[#5B6CF9] animate-pulse" />
                )}
              </button>
              <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/15 rounded-xl h-9">
                <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>

          {/* Student Card */}
          <Card className="p-3.5 border-0 shadow-xl rounded-2xl bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center font-bold text-white text-lg overflow-hidden shrink-0">
                {current?.photo_url ? <img src={current.photo_url} alt="" className="h-full w-full object-cover" /> : current?.name?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">{current?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{current?.class} • NIS {current?.student_id}</p>
              </div>
              {students.length > 1 && (
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-auto h-9 text-xs rounded-xl border-[#5B6CF9]/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-5 -mt-1 pt-4 space-y-4">
        {/* HOME */}
        {tab === "home" && (
          <>
            {/* Period Filter */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl w-fit">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setStatPeriod(p)}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all",
                    statPeriod === p ? "bg-white shadow text-[#5B6CF9]" : "text-muted-foreground"
                  )}
                >
                  {p === "day" ? "Hari Ini" : p === "week" ? "7 Hari" : "30 Hari"}
                </button>
              ))}
            </div>

            {(() => {
              const now = new Date();
              const cutoff = new Date(now);
              if (statPeriod === "day") cutoff.setHours(0, 0, 0, 0);
              else if (statPeriod === "week") cutoff.setDate(now.getDate() - 7);
              else cutoff.setDate(now.getDate() - 30);
              const filtered = attendance.filter((a) => new Date(a.date) >= cutoff);
              const c = (s: string) => filtered.filter((a) => a.status === s).length;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <StatCard icon={CheckCircle2} label="Hadir" value={c("hadir")} color="emerald" />
                  <StatCard icon={FileText} label="Izin" value={c("izin")} color="amber" />
                  <StatCard icon={Clock} label="Sakit" value={c("sakit")} color="sky" />
                  <StatCard icon={XCircle} label="Alfa" value={c("alfa")} color="red" />
                </div>
              );
            })()}

            {/* Statistik Garis */}
            <Card className="p-4 border-0 shadow-card rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#5B6CF9]" />
                  Statistik Kehadiran — {statPeriod === "day" ? "Hari Ini" : statPeriod === "week" ? "7 Hari" : "30 Hari"}
                </h3>
              </div>
              <div className="h-48 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildChartData(attendance, statPeriod)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                      formatter={(value: number, name: string) => [`${value}`, STATUS_LABELS[name] || name]}
                    />
                    <Line type="monotone" dataKey="hadir" stroke={STATUS_COLORS.hadir} strokeWidth={2.5} dot={{ r: 3 }} name="hadir" />
                    <Line type="monotone" dataKey="izin" stroke={STATUS_COLORS.izin} strokeWidth={2} dot={{ r: 2.5 }} name="izin" />
                    <Line type="monotone" dataKey="sakit" stroke={STATUS_COLORS.sakit} strokeWidth={2} dot={{ r: 2.5 }} name="sakit" />
                    <Line type="monotone" dataKey="alfa" stroke={STATUS_COLORS.alfa} strokeWidth={2} dot={{ r: 2.5 }} name="alfa" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[11px]">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
                    <span className="text-muted-foreground font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Jadwal Hari Ini */}
            <SectionTitle icon={CalendarDays} title="Jadwal Hari Ini" onMore={() => setTab("schedule")} />
            {(() => {
              const todays = schedule.filter((s) => s.day_of_week === new Date().getDay()).sort((a,b)=>(a.start_time||"").localeCompare(b.start_time||""));
              if (todays.length === 0) return <EmptyMini text="Tidak ada jadwal hari ini." />;
              const nowHHMM = new Date().toTimeString().slice(0,5);
              return (
                <div className="space-y-2">
                  {todays.slice(0, 3).map((s) => {
                    const isOn = (s.start_time||"").slice(0,5) <= nowHHMM && nowHHMM < (s.end_time||"").slice(0,5);
                    const subjColor = s.subjects?.color || "#5B6CF9";
                    return (
                      <Card key={s.id} className={cn("relative overflow-hidden p-0 border-0 shadow-card rounded-2xl", isOn && "ring-2 ring-emerald-500/50")}>
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subjColor }} />
                        <div className="flex items-center gap-3 p-3 pl-4">
                          <div className="flex flex-col items-center justify-center min-w-[54px] py-1.5 rounded-xl" style={{ backgroundColor: `${subjColor}15`, color: subjColor }}>
                            <span className="text-xs font-bold leading-none">{s.start_time?.slice(0,5)}</span>
                            <span className="text-[9px] opacity-70 mt-0.5">{s.end_time?.slice(0,5)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{s.subjects?.name || "—"}</p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />{s.profiles?.full_name || "Guru"}{s.room ? ` • ${s.room}` : ""}
                            </p>
                          </div>
                          {isOn && <Badge className="bg-emerald-500 text-white border-0 text-[9px] font-bold shrink-0">LIVE</Badge>}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            {/* Info Sekolah */}
            <SectionTitle icon={Megaphone} title="Informasi Terbaru" onMore={() => setTab("info")} />
            {announcements.length === 0 ? (
              <EmptyMini text="Belum ada informasi dari sekolah." />
            ) : (
              <div className="space-y-2">
                {announcements.slice(0, 2).map((a) => (
                  <Card key={a.id} className="p-3.5 border-0 shadow-card rounded-2xl">
                    <div className="flex items-start gap-2 mb-1">
                      {a.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      <p className="text-sm font-bold flex-1">{a.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: a.message }} />
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ATTENDANCE */}
        {tab === "attendance" && (
          <>
            <SectionTitle icon={ClipboardList} title="Riwayat Absensi 30 Hari" />
            {attendance.length === 0 ? <EmptyMini text="Belum ada data absensi." /> : (
              <div className="space-y-2">
                {attendance.map((a) => (
                  <Card key={a.id} className="p-3 border-0 shadow-card rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{new Date(a.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-muted-foreground">{a.attendance_type === "pulang" ? "Pulang" : "Datang"} • {a.time?.slice(0, 5)} • {a.method}</p>
                    </div>
                    <Badge className={cn("border-0", STATUS_LABEL[a.status]?.cls)}>{STATUS_LABEL[a.status]?.label || a.status}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* SCHEDULE */}
        {tab === "schedule" && (
          <>
            {(() => {
              const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
              const today = new Date();
              const dow = today.getDay();
              const nowHHMM = today.toTimeString().slice(0, 5);
              const todays = schedule.filter((s) => s.day_of_week === dow);
              const ongoing = todays.find((s) => (s.start_time || "").slice(0,5) <= nowHHMM && nowHHMM < (s.end_time || "").slice(0,5));
              const next = todays.find((s) => (s.start_time || "").slice(0,5) > nowHHMM);
              const grouped: Record<number, any[]> = {};
              schedule.forEach((s) => { (grouped[s.day_of_week] ||= []).push(s); });
              const days = Object.keys(grouped).map(Number).sort();

              return (
                <>
                  {/* Sedang Berlangsung */}
                  <SectionTitle icon={Clock} title="Sedang Berlangsung" />
                  {ongoing ? (() => {
                    const [sh, sm] = (ongoing.start_time || "00:00").split(":").map(Number);
                    const [eh, em] = (ongoing.end_time || "00:00").split(":").map(Number);
                    const startMin = sh * 60 + sm;
                    const endMin = eh * 60 + em;
                    const nowMin = today.getHours() * 60 + today.getMinutes();
                    const progress = Math.min(100, Math.max(0, ((nowMin - startMin) / Math.max(1, endMin - startMin)) * 100));
                    const remain = Math.max(0, endMin - nowMin);
                    const color = ongoing.subjects?.color || "#10b981";
                    return (
                      <Card className="p-0 border-0 shadow-card rounded-2xl overflow-hidden text-white relative" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 0%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                        <div className="relative p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                <Badge className="bg-white/25 text-white border-0 text-[10px] font-bold tracking-wider">SEDANG BERLANGSUNG</Badge>
                              </div>
                              <p className="font-bold text-lg leading-tight truncate">{ongoing.subjects?.name || "—"}</p>
                              <p className="text-xs text-white/85 truncate mt-0.5 flex items-center gap-1">
                                <User className="h-3 w-3" />{ongoing.profiles?.full_name || "Guru"}{ongoing.room ? ` • ${ongoing.room}` : ""}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Sisa</p>
                              <p className="text-xl font-bold leading-none mt-0.5">{remain}<span className="text-xs font-medium ml-0.5">m</span></p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/80 font-medium">
                            <span>{ongoing.start_time?.slice(0,5)}</span>
                            <span>{Math.round(progress)}%</span>
                            <span>{ongoing.end_time?.slice(0,5)}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })() : next ? (
                    <Card className="p-3.5 border-0 shadow-card rounded-2xl border-l-4 border-l-[#5B6CF9]">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Berikutnya</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{next.subjects?.name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{next.profiles?.full_name || "Guru"}{next.room ? ` • ${next.room}` : ""}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-[#5B6CF9]/30 text-[#5B6CF9] shrink-0">{next.start_time?.slice(0,5)}</Badge>
                      </div>
                    </Card>
                  ) : (
                    <EmptyMini text="Tidak ada mata pelajaran yang sedang berlangsung." />
                  )}

                  {/* Jadwal Mingguan */}
                  <SectionTitle icon={CalendarDays} title="Jadwal Pelajaran Mingguan" />
                  {schedule.length === 0 ? <EmptyMini text="Belum ada jadwal pelajaran." /> : (
                    <div className="space-y-3">
                      {days.map((d) => {
                        const isToday = d === dow;
                        const dayGradient = isToday
                          ? "from-[#5B6CF9] to-[#4c5ded]"
                          : d % 2 === 0
                            ? "from-violet-500 to-fuchsia-500"
                            : "from-emerald-500 to-teal-500";
                        return (
                          <Card key={d} className="border-0 shadow-card rounded-2xl overflow-hidden">
                            {/* Day Header */}
                            <div className={cn("relative px-4 py-2.5 bg-gradient-to-r text-white flex items-center justify-between", dayGradient)}>
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                              <div className="relative flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                <p className="text-sm font-bold tracking-wide">{DAY_NAMES[d]}</p>
                              </div>
                              {isToday && (
                                <Badge className="relative bg-white/25 text-white border-0 text-[10px] font-bold backdrop-blur">
                                  <span className="relative flex h-1.5 w-1.5 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                                  </span>
                                  Hari Ini
                                </Badge>
                              )}
                            </div>
                            {/* Lessons */}
                            <div className="p-2.5 space-y-1.5 bg-gradient-to-b from-background to-muted/20">
                              {grouped[d].sort((a,b)=>(a.start_time||"").localeCompare(b.start_time||"")).map((s) => {
                                const isOn = isToday && (s.start_time||"").slice(0,5) <= nowHHMM && nowHHMM < (s.end_time||"").slice(0,5);
                                const subjColor = s.subjects?.color || "#5B6CF9";
                                return (
                                  <div key={s.id} className={cn("relative rounded-xl bg-card border border-border/50 p-2.5 pl-3 flex items-center gap-3 hover:shadow-md transition-all", isOn && "ring-2 ring-emerald-500/60 shadow-md")}>
                                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ backgroundColor: subjColor }} />
                                    <div className="flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-lg" style={{ backgroundColor: `${subjColor}15`, color: subjColor }}>
                                      <span className="text-[10px] font-bold leading-none">{s.start_time?.slice(0,5)}</span>
                                      <span className="text-[8px] opacity-70 mt-0.5">{s.end_time?.slice(0,5)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold truncate">{s.subjects?.name || "—"}</p>
                                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                        <User className="h-2.5 w-2.5" />{s.profiles?.full_name || "Guru"}{s.room ? ` • ${s.room}` : ""}
                                      </p>
                                    </div>
                                    {isOn && (
                                      <Badge className="bg-emerald-500 text-white border-0 text-[9px] font-bold">LIVE</Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* INFO */}
        {tab === "info" && (
          <>
            <SectionTitle icon={Megaphone} title="Informasi dari Sekolah" />
            <p className="text-[11px] text-muted-foreground -mt-2">Hanya menampilkan pengumuman yang ditujukan kepada wali murid.</p>
            {announcements.length === 0 ? <EmptyMini text="Belum ada informasi untuk wali murid." /> : (
              <div className="space-y-2.5">
                {announcements.map((a) => (
                  <Card key={a.id} className={cn("p-4 border-0 shadow-card rounded-2xl", a.is_pinned && "ring-1 ring-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10")}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <p className="text-sm font-bold truncate">{a.title}</p>
                      </div>
                      {a.is_pinned && <Badge className="bg-amber-500 text-white border-0 text-[10px] shrink-0">Penting</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap [&_*]:!text-xs" dangerouslySetInnerHTML={{ __html: a.message }} />
                    <p className="text-[10px] text-muted-foreground mt-2.5">{new Date(a.created_at).toLocaleString("id-ID")}</p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* LEAVE */}
        {tab === "leave" && (
          <>
            <Card className="p-4 border-0 shadow-card rounded-2xl space-y-3">
              <SectionTitle icon={FileText} title="Ajukan Izin / Sakit" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Jenis</Label>
                  <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tanggal</Label>
                  <Input className="mt-1" type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Alasan</Label>
                <Textarea className="mt-1" rows={3} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Tuliskan alasan..." />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />Lampiran Surat (opsional)</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-1.5">Foto / gambar surat izin atau surat dokter. Maks 5MB.</p>
                {leaveForm.attachment_url ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <a href={leaveForm.attachment_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={leaveForm.attachment_url} alt="lampiran" className="h-12 w-12 object-cover rounded-lg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </a>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Lampiran terupload</p>
                      <a href={leaveForm.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground truncate block hover:underline">Lihat file</a>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setLeaveForm({ ...leaveForm, attachment_url: null })} className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className={cn("flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#5B6CF9]/30 bg-[#5B6CF9]/5 cursor-pointer hover:bg-[#5B6CF9]/10 transition-colors", uploadingFile && "opacity-50 pointer-events-none")}>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} disabled={uploadingFile} />
                    {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-[#5B6CF9]" /> : <Paperclip className="h-4 w-4 text-[#5B6CF9]" />}
                    <span className="text-xs font-semibold text-[#5B6CF9]">{uploadingFile ? "Mengupload..." : "Pilih Foto / PDF"}</span>
                  </label>
                )}
              </div>
              <Button onClick={submitLeave} disabled={uploadingFile} className="w-full bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] hover:opacity-90 text-white rounded-xl">Kirim Pengajuan</Button>
            </Card>
            <SectionTitle icon={ClipboardList} title="Riwayat Pengajuan" />
            {leaves.length === 0 ? <EmptyMini text="Belum ada pengajuan." /> : (
              <div className="space-y-2">
                {leaves.map((l) => {
                  const Icon = l.status === "approved" ? CheckCircle2 : l.status === "rejected" ? XCircle : Clock;
                  const cls = l.status === "approved" ? "text-emerald-600" : l.status === "rejected" ? "text-red-600" : "text-amber-600";
                  return (
                    <Card key={l.id} className="p-3 border-0 shadow-card rounded-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold capitalize">{l.type} • {new Date(l.date).toLocaleDateString("id-ID")}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{l.reason}</p>
                          {l.review_note && <p className="text-[11px] text-muted-foreground mt-1">Catatan: {l.review_note}</p>}
                          {l.attachment_url && (
                            <a href={l.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#5B6CF9] font-semibold mt-1.5 hover:underline">
                              <Paperclip className="h-3 w-3" />Lihat lampiran
                            </a>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold capitalize shrink-0 ${cls}`}><Icon className="h-3.5 w-3.5" />{l.status}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* SPP */}
        {tab === "spp" && (
          <>
            <SectionTitle icon={Wallet} title="Pembayaran SPP" />

            {/* Ringkasan Tunggakan */}
            {sppData.total_tunggakan > 0 && (
              <Card className="p-4 border-0 shadow-card rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Total Tunggakan</p>
                <p className="text-2xl font-extrabold mt-1">Rp {sppData.total_tunggakan.toLocaleString("id-ID")}</p>
                <p className="text-xs text-white/85 mt-1">{sppData.tunggakan.length} bulan belum dibayar</p>
              </Card>
            )}

            {/* Tagihan Aktif */}
            <SectionTitle icon={AlertCircle} title="Tagihan Aktif" />
            {sppData.aktif.length === 0 ? <EmptyMini text="Tidak ada tagihan aktif." /> : (
              <div className="space-y-2">
                {sppData.aktif.map((inv) => {
                  const isExpired = inv.status === "expired";
                  return (
                    <Card key={inv.id} className="p-3.5 border-0 shadow-card rounded-2xl">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{inv.period_label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{inv.invoice_number}</p>
                        </div>
                        <Badge className={cn("border-0 text-[10px]", isExpired ? "bg-orange-500 text-white" : "bg-amber-500 text-white")}>
                          {isExpired ? "Kadaluarsa" : "Menunggu"}
                        </Badge>
                      </div>
                      <p className="text-lg font-extrabold text-[#5B6CF9]">Rp {(inv.total_amount || 0).toLocaleString("id-ID")}</p>
                      <p className="text-[11px] text-muted-foreground mb-2.5">Jatuh tempo: {inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</p>
                      <Button
                        size="sm"
                        className={cn("w-full text-white", isExpired ? "bg-orange-600 hover:bg-orange-700" : "bg-[#5B6CF9] hover:bg-[#4c5ded]")}
                        disabled={sppBusy === inv.id}
                        onClick={() => paySpp(inv.id)}
                      >
                        {sppBusy === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                          isExpired ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Buat Link Baru & Bayar</> : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Bayar Sekarang</>
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Riwayat Lunas */}
            <SectionTitle icon={CheckCircle2} title="Riwayat Pembayaran" />
            {sppData.lunas.length === 0 ? <EmptyMini text="Belum ada pembayaran." /> : (
              <div className="space-y-2">
                {sppData.lunas.map((inv) => (
                  <Card key={inv.id} className="p-3.5 border-0 shadow-card rounded-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-bold truncate">{inv.period_label}</p>
                          <Badge className="bg-emerald-500 text-white border-0 text-[9px]">LUNAS</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"} • {(inv.payment_method || "Mayar").toUpperCase()}</p>
                        <p className="text-sm font-extrabold text-emerald-600 mt-0.5">Rp {(inv.total_amount || 0).toLocaleString("id-ID")}</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" disabled={sppBusy === `pdf-${inv.id}`} onClick={() => downloadSppPdf(inv)}>
                        {sppBusy === `pdf-${inv.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="h-3.5 w-3.5 mr-1" /> Invoice</>}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}


        {tab === "contact" && (
          <>
            <SectionTitle icon={Phone} title="Kontak Wali Kelas" />
            {!homeroom ? <EmptyMini text="Memuat..." /> : (
              <>
                <Card className="p-4 border-0 shadow-card rounded-2xl">
                  {homeroom.teacher ? (
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                        {homeroom.teacher.avatar_url ? <img src={homeroom.teacher.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">{homeroom.teacher.full_name}</p>
                        <p className="text-xs text-muted-foreground">Wali Kelas {homeroom.class_name}</p>
                        {homeroom.teacher.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" />{homeroom.teacher.phone}</p>
                        )}
                        {homeroom.teacher.phone && (
                          <div className="flex gap-2 mt-2.5">
                            <a href={`https://wa.me/${homeroom.teacher.phone.replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                              <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"><MessageCircle className="h-4 w-4 mr-1.5" />WhatsApp</Button>
                            </a>
                            <a href={`tel:${homeroom.teacher.phone}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full rounded-xl"><Phone className="h-4 w-4 mr-1.5" />Telepon</Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Wali kelas belum ditetapkan oleh sekolah.</p>
                  )}
                </Card>

                {homeroom.school && (
                  <Card className="p-4 border-0 shadow-card rounded-2xl">
                    <SectionTitle icon={GraduationCap} title="Informasi Sekolah" />
                    <div className="mt-2 space-y-1.5">
                      <p className="text-sm font-bold">{homeroom.school.name}</p>
                      {homeroom.school.address && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{homeroom.school.address}</p>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* Bottom Footer Nav — compact 4 tabs + More */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-2 py-1.5">
          <div className="flex items-center justify-around gap-1">
            {PRIMARY_TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1 max-w-[80px]",
                    active ? "text-[#5B6CF9]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                    active ? "bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white shadow-md scale-110" : ""
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              );
            })}

            {/* More button */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1 max-w-[80px]",
                    MORE_TABS.find((m) => m.id === tab) ? "text-[#5B6CF9]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                    MORE_TABS.find((m) => m.id === tab) ? "bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white shadow-md scale-110" : ""
                  )}>
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium">Lainnya</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-0 pb-8">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left">Menu Lainnya</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-2">
                  {MORE_TABS.map((m) => {
                    const Icon = m.icon;
                    const active = tab === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setTab(m.id);
                          (document.activeElement as HTMLElement)?.blur();
                          // close sheet via Escape simulation
                          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left",
                          active
                            ? "bg-gradient-to-br from-[#5B6CF9]/10 to-[#4c5ded]/10 border-[#5B6CF9]/30"
                            : "bg-card border-border hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                          active
                            ? "bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white shadow-md"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{m.label}</p>
                          <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    sky: "bg-sky-500/10 text-sky-600",
    red: "bg-red-500/10 text-red-600",
  };
  return (
    <Card className="p-3 border-0 shadow-card rounded-2xl">
      <div className="flex items-center gap-2">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", colors[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, onMore }: any) {
  return (
    <div className="flex items-center justify-between mt-1">
      <h3 className="text-sm font-bold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-[#5B6CF9]" /> {title}
      </h3>
      {onMore && (
        <button onClick={onMore} className="text-[11px] text-[#5B6CF9] font-semibold hover:underline">Lihat semua →</button>
      )}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <Card className="p-6 border-0 shadow-card rounded-2xl text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </Card>
  );
}
