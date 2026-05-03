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
  MessageSquare, ClipboardList, Send, BookOpen, CheckCircle2, XCircle, Clock,
  Sparkles, TrendingUp, Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  hadir: { label: "Hadir", cls: "bg-emerald-500 text-white" },
  izin: { label: "Izin", cls: "bg-amber-500 text-white" },
  sakit: { label: "Sakit", cls: "bg-sky-500 text-white" },
  alfa: { label: "Alfa", cls: "bg-red-500 text-white" },
};

const TABS = [
  { id: "home", label: "Beranda", icon: Sparkles },
  { id: "attendance", label: "Absensi", icon: ClipboardList },
  { id: "schedule", label: "Jadwal", icon: CalendarDays },
  { id: "info", label: "Info", icon: Megaphone },
  { id: "leave", label: "Izin", icon: FileText },
  { id: "grades", label: "Nilai", icon: BookOpen },
  { id: "chat", label: "Chat", icon: MessageSquare },
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
  const [messages, setMessages] = useState<any[]>([]);

  const [leaveForm, setLeaveForm] = useState({ type: "izin", date: new Date().toISOString().slice(0, 10), reason: "" });
  const [chatInput, setChatInput] = useState("");

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
    } else if (tab === "grades") {
      const d = await invoke("grades", body); setGrades(d.grades || []);
    } else if (tab === "chat") {
      const d = await invoke("list_messages", body); setMessages(d.messages || []);
    }
  }, [tab, selectedStudent, invoke]);

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
    setLeaveForm({ ...leaveForm, reason: "" });
    loadTab();
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const d = await invoke("send_message", { student_id: selectedStudent, message: chatInput });
    if (d?.error) return toast.error(d.error);
    setChatInput("");
    loadTab();
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

  // Stats untuk beranda
  const stats = (() => {
    const last30 = attendance;
    const hadir = last30.filter(a => a.status === "hadir").length;
    const izin = last30.filter(a => a.status === "izin").length;
    const sakit = last30.filter(a => a.status === "sakit").length;
    const alfa = last30.filter(a => a.status === "alfa").length;
    const total = last30.length || 1;
    const persen = Math.round((hadir / total) * 100);
    return { hadir, izin, sakit, alfa, persen };
  })();

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
            <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/15 rounded-xl h-9">
              <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Keluar</span>
            </Button>
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
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatCard icon={CheckCircle2} label="Hadir" value={stats.hadir} color="emerald" />
              <StatCard icon={FileText} label="Izin" value={stats.izin} color="amber" />
              <StatCard icon={Clock} label="Sakit" value={stats.sakit} color="sky" />
              <StatCard icon={XCircle} label="Alfa" value={stats.alfa} color="red" />
            </div>

            {/* Persentase */}
            <Card className="p-4 border-0 shadow-card rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80">Persentase Kehadiran 30 Hari</p>
                  <p className="text-3xl font-bold mt-0.5">{stats.persen}%</p>
                </div>
                <TrendingUp className="h-12 w-12 text-white/30" />
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${stats.persen}%` }} />
              </div>
            </Card>

            {/* Jadwal Hari Ini */}
            <SectionTitle icon={CalendarDays} title="Jadwal Hari Ini" onMore={() => setTab("schedule")} />
            {schedule.length === 0 ? (
              <EmptyMini text="Tidak ada jadwal hari ini." />
            ) : (
              <div className="space-y-2">
                {schedule.slice(0, 3).map((s) => (
                  <Card key={s.id} className="p-3 border-0 shadow-card rounded-2xl flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{s.subjects?.name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.profiles?.full_name || "Guru"} {s.room ? `• ${s.room}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-[#5B6CF9]/30 text-[#5B6CF9] shrink-0">{s.start_time?.slice(0, 5)}</Badge>
                  </Card>
                ))}
              </div>
            )}

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
            <SectionTitle icon={CalendarDays} title="Jadwal Hari Ini" />
            {schedule.length === 0 ? <EmptyMini text="Tidak ada jadwal hari ini." /> : (
              <div className="space-y-2">
                {schedule.map((s) => (
                  <Card key={s.id} className="p-3.5 border-0 shadow-card rounded-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{s.subjects?.name || "—"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{s.profiles?.full_name || "Guru"} {s.room ? `• ${s.room}` : ""}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-[#5B6CF9]/30 text-[#5B6CF9] shrink-0">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
              <Button onClick={submitLeave} className="w-full bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] hover:opacity-90 text-white rounded-xl">Kirim Pengajuan</Button>
            </Card>
            <SectionTitle icon={ClipboardList} title="Riwayat Pengajuan" />
            {leaves.length === 0 ? <EmptyMini text="Belum ada pengajuan." /> : (
              <div className="space-y-2">
                {leaves.map((l) => {
                  const Icon = l.status === "approved" ? CheckCircle2 : l.status === "rejected" ? XCircle : Clock;
                  const cls = l.status === "approved" ? "text-emerald-600" : l.status === "rejected" ? "text-red-600" : "text-amber-600";
                  return (
                    <Card key={l.id} className="p-3 border-0 shadow-card rounded-2xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize">{l.type} • {new Date(l.date).toLocaleDateString("id-ID")}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{l.reason}</p>
                          {l.review_note && <p className="text-[11px] text-muted-foreground mt-1">Catatan: {l.review_note}</p>}
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

        {/* GRADES */}
        {tab === "grades" && (
          <>
            <SectionTitle icon={BookOpen} title="Rekap Nilai" />
            {grades.length === 0 ? <EmptyMini text="Belum ada nilai dipublikasikan." /> : (
              <div className="space-y-2">
                {grades.map((g) => (
                  <Card key={g.id} className="p-3 border-0 shadow-card rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{g.subject}</p>
                      <p className="text-xs text-muted-foreground">{g.school_year} • Sem {g.semester} • {g.term}</p>
                    </div>
                    <span className="text-xl font-extrabold text-[#5B6CF9]">{Number(g.score).toFixed(0)}</span>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <Card className="border-0 shadow-card rounded-2xl flex flex-col h-[65vh]">
            <div className="p-3.5 border-b text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#5B6CF9]" /> Chat ke Wali Kelas
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Belum ada pesan.</p> : messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === "parent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_type === "parent" ? "bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Tulis pesan..." onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <Button onClick={sendChat} className="bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white rounded-xl"><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Footer Nav (mobile + desktop) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-2 py-1.5 overflow-x-auto">
          <div className="flex items-center justify-between gap-1 min-w-max sm:min-w-0 sm:justify-around">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[58px]",
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
