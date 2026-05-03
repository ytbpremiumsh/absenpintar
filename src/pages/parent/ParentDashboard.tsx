import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, LogOut, GraduationCap, CalendarDays, Megaphone, FileText,
  MessageSquare, ClipboardList, Send, BookOpen, CheckCircle2, XCircle, Clock,
} from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  hadir: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  izin: { label: "Izin", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  sakit: { label: "Sakit", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  alfa: { label: "Alfa", cls: "bg-red-100 text-red-700 border-red-200" },
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("parent_token") || "");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("attendance");

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
    if (tab === "attendance") {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5B6CF9]/5 via-background to-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] text-white p-4 sm:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/70">Dashboard Wali Murid</p>
              <h1 className="text-base sm:text-lg font-bold truncate">{current?.schools?.name || "Sekolah"}</h1>
            </div>
          </div>
          <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <LogOut className="h-4 w-4 mr-1" /> Keluar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Student switcher */}
        {students.length > 1 ? (
          <Card className="p-3 border-0 shadow-card">
            <Label className="text-xs mb-1 block">Pilih Anak</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}</SelectItem>)}
              </SelectContent>
            </Select>
          </Card>
        ) : (
          <Card className="p-4 border-0 shadow-card flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden">
              {current?.photo_url ? <img src={current.photo_url} alt="" className="h-full w-full object-cover" /> : current?.name?.[0]}
            </div>
            <div>
              <p className="font-bold text-foreground">{current?.name}</p>
              <p className="text-xs text-muted-foreground">{current?.class} • NIS {current?.student_id}</p>
            </div>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="attendance" className="text-xs gap-1"><ClipboardList className="h-3.5 w-3.5" />Absensi</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs gap-1"><CalendarDays className="h-3.5 w-3.5" />Jadwal</TabsTrigger>
            <TabsTrigger value="info" className="text-xs gap-1"><Megaphone className="h-3.5 w-3.5" />Info</TabsTrigger>
            <TabsTrigger value="leave" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" />Izin</TabsTrigger>
            <TabsTrigger value="grades" className="text-xs gap-1"><BookOpen className="h-3.5 w-3.5" />Nilai</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" />Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-2 mt-4">
            <h3 className="text-sm font-bold">Riwayat Absensi 30 Hari Terakhir</h3>
            {attendance.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : attendance.map((a) => (
              <Card key={a.id} className="p-3 border-0 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{new Date(a.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-muted-foreground">{a.attendance_type === "pulang" ? "Pulang" : "Datang"} • {a.time?.slice(0, 5)} • {a.method}</p>
                </div>
                <Badge className={`${STATUS_LABEL[a.status]?.cls || ""} border`}>{STATUS_LABEL[a.status]?.label || a.status}</Badge>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-2 mt-4">
            <h3 className="text-sm font-bold">Jadwal Hari Ini</h3>
            {schedule.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada jadwal hari ini.</p> : schedule.map((s) => (
              <Card key={s.id} className="p-3 border-0 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{s.subjects?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.profiles?.full_name || "Guru"} {s.room ? `• ${s.room}` : ""}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="info" className="space-y-2 mt-4">
            <h3 className="text-sm font-bold">Informasi Sekolah</h3>
            {announcements.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p> : announcements.map((a) => (
              <Card key={a.id} className="p-4 border-0 shadow-card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold">{a.title}</p>
                  {a.is_pinned && <Badge className="text-[10px]">Penting</Badge>}
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{a.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString("id-ID")}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="leave" className="space-y-3 mt-4">
            <Card className="p-4 border-0 shadow-card space-y-3">
              <h3 className="text-sm font-bold">Ajukan Izin / Sakit</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Jenis</Label>
                  <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tanggal</Label>
                  <Input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Alasan</Label>
                <Textarea rows={3} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Tuliskan alasan..." />
              </div>
              <Button onClick={submitLeave} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded] text-white">Kirim Pengajuan</Button>
            </Card>
            <h3 className="text-sm font-bold">Riwayat Pengajuan</h3>
            {leaves.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pengajuan.</p> : leaves.map((l) => {
              const Icon = l.status === "approved" ? CheckCircle2 : l.status === "rejected" ? XCircle : Clock;
              const cls = l.status === "approved" ? "text-emerald-600" : l.status === "rejected" ? "text-red-600" : "text-amber-600";
              return (
                <Card key={l.id} className="p-3 border-0 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold capitalize">{l.type} • {new Date(l.date).toLocaleDateString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">{l.reason}</p>
                      {l.review_note && <p className="text-[11px] text-muted-foreground mt-1">Catatan: {l.review_note}</p>}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${cls}`}><Icon className="h-3.5 w-3.5" />{l.status}</span>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="grades" className="space-y-2 mt-4">
            <h3 className="text-sm font-bold">Rekap Nilai</h3>
            {grades.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada nilai dipublikasikan.</p> : grades.map((g) => (
              <Card key={g.id} className="p-3 border-0 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{g.subject}</p>
                  <p className="text-xs text-muted-foreground">{g.school_year} • Sem {g.semester} • {g.term}</p>
                </div>
                <span className="text-lg font-extrabold text-[#5B6CF9]">{Number(g.score).toFixed(0)}</span>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card className="border-0 shadow-card flex flex-col h-[60vh]">
              <div className="p-3 border-b text-sm font-bold">Chat ke Wali Kelas</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Belum ada pesan.</p> : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === "parent" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_type === "parent" ? "bg-[#5B6CF9] text-white" : "bg-muted"}`}>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Tulis pesan..." onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <Button onClick={sendChat} className="bg-[#5B6CF9] hover:bg-[#4c5ded] text-white"><Send className="h-4 w-4" /></Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
