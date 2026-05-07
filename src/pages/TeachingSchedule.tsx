import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Plus, Pencil, Trash2, BookOpen, Clock, Users as UsersIcon, Calendar, Search, GraduationCap, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface Subject {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  is_active: boolean;
}

interface Schedule {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  is_active: boolean;
  notes: string | null;
}

interface TeacherProfile {
  user_id: string;
  full_name: string;
}

interface ClassData {
  id: string;
  name: string;
}

export default function TeachingSchedule() {
  const { user, profile, roles } = useAuth();
  const isAdmin = roles.includes("school_admin") || roles.includes("super_admin");
  const schoolId = profile?.school_id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedules");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Schedule form
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: "",
    subject_id: "",
    class_id: "",
    day_of_week: 0,
    start_time: "07:00",
    end_time: "08:00",
    room: "",
    notes: "",
  });

  // Subject form
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", color: "#3B82F6" });

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [subjectsRes, schedulesRes, classesRes, teachersRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
        supabase.from("teaching_schedules").select("*").eq("school_id", schoolId).eq("is_active", true).order("day_of_week").order("start_time"),
        supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name"),
        supabase.from("profiles").select("user_id, full_name").eq("school_id", schoolId),
      ]);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (schedulesRes.data) setSchedules(schedulesRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (teachersRes.data) setTeachers(teachersRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [schoolId]);

  // Subject CRUD
  const saveSubject = async () => {
    if (!schoolId || !subjectForm.name.trim()) return;
    const payload = { school_id: schoolId, name: subjectForm.name.trim(), code: subjectForm.code.trim() || null, color: subjectForm.color };
    let error;
    if (editingSubject) {
      ({ error } = await supabase.from("subjects").update(payload).eq("id", editingSubject.id));
    } else {
      ({ error } = await supabase.from("subjects").insert(payload));
    }
    if (error) { toast.error("Gagal menyimpan mapel: " + error.message); return; }
    toast.success(editingSubject ? "Mapel diperbarui" : "Mapel ditambahkan");
    setSubjectDialog(false);
    setEditingSubject(null);
    setSubjectForm({ name: "", code: "", color: "#3B82F6" });
    fetchData();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Hapus mata pelajaran ini?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus: " + error.message); return; }
    toast.success("Mapel dihapus");
    fetchData();
  };

  // Schedule CRUD
  const saveSchedule = async () => {
    if (!schoolId || !formData.teacher_id || !formData.subject_id || !formData.class_id) {
      toast.error("Lengkapi semua field wajib");
      return;
    }
    const payload = {
      school_id: schoolId,
      teacher_id: formData.teacher_id,
      subject_id: formData.subject_id,
      class_id: formData.class_id,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room || null,
      notes: formData.notes || null,
    };
    let error;
    if (editingSchedule) {
      ({ error } = await supabase.from("teaching_schedules").update(payload).eq("id", editingSchedule.id));
    } else {
      ({ error } = await supabase.from("teaching_schedules").insert(payload));
    }
    if (error) { toast.error("Gagal menyimpan jadwal: " + error.message); return; }
    toast.success(editingSchedule ? "Jadwal diperbarui" : "Jadwal ditambahkan");
    setScheduleDialog(false);
    setEditingSchedule(null);
    resetForm();
    fetchData();
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    const { error } = await supabase.from("teaching_schedules").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus: " + error.message); return; }
    toast.success("Jadwal dihapus");
    fetchData();
  };

  const resetForm = () => {
    setFormData({ teacher_id: "", subject_id: "", class_id: "", day_of_week: 0, start_time: "07:00", end_time: "08:00", room: "", notes: "" });
  };

  const openEditSchedule = (s: Schedule) => {
    setEditingSchedule(s);
    setFormData({
      teacher_id: s.teacher_id,
      subject_id: s.subject_id,
      class_id: s.class_id,
      day_of_week: s.day_of_week,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
      room: s.room || "",
      notes: s.notes || "",
    });
    setScheduleDialog(true);
  };

  const getTeacherName = (id: string) => teachers.find((t) => t.user_id === id)?.full_name || "—";
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "—";
  const getSubjectColor = (id: string) => subjects.find((s) => s.id === id)?.color || "#3B82F6";
  const getClassName = (id: string) => classes.find((c) => c.id === id)?.name || "—";

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    if (selectedDay !== "all") filtered = filtered.filter((s) => s.day_of_week === parseInt(selectedDay));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        getTeacherName(s.teacher_id).toLowerCase().includes(q) ||
        getSubjectName(s.subject_id).toLowerCase().includes(q) ||
        getClassName(s.class_id).toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [schedules, selectedDay, searchQuery, teachers, subjects, classes]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: Record<number, Schedule[]> = {};
    filteredSchedules.forEach((s) => {
      if (!groups[s.day_of_week]) groups[s.day_of_week] = [];
      groups[s.day_of_week].push(s);
    });
    return groups;
  }, [filteredSchedules]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={CalendarDays} title="Jadwal Mengajar" subtitle="Memuat data..." />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader icon={CalendarDays} title="Jadwal Mengajar" subtitle="Kelola jadwal mengajar guru dan mata pelajaran" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="schedules" className="gap-1.5"><Calendar className="h-4 w-4" />Jadwal</TabsTrigger>
          {isAdmin && <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-4 w-4" />Mata Pelajaran</TabsTrigger>}
        </TabsList>

        {/* ===== SCHEDULES TAB ===== */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari guru, mapel, kelas..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Semua Hari" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Hari</SelectItem>
                {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Dialog open={scheduleDialog} onOpenChange={(o) => { setScheduleDialog(o); if (!o) { setEditingSchedule(null); resetForm(); } }}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" />Tambah Jadwal</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Guru *</Label>
                      <Select value={formData.teacher_id} onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                        <SelectContent>{teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mata Pelajaran *</Label>
                      <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                        <SelectContent>{subjects.filter((s) => s.is_active).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Kelas *</Label>
                      <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hari *</Label>
                      <Select value={String(formData.day_of_week)} onValueChange={(v) => setFormData({ ...formData, day_of_week: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Jam Mulai *</Label>
                        <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                      </div>
                      <div>
                        <Label>Jam Selesai *</Label>
                        <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Ruangan</Label>
                      <Input placeholder="Contoh: Lab IPA, R. 201" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} />
                    </div>
                    <div>
                      <Label>Catatan</Label>
                      <Input placeholder="Catatan tambahan" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    <Button onClick={saveSchedule} className="w-full">{editingSchedule ? "Simpan Perubahan" : "Tambah Jadwal"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            <Card className="border-0 shadow-card rounded-2xl"><CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
              <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold leading-none">{schedules.length}</p><p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">Total Jadwal</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-card rounded-2xl"><CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0"><UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /></div>
              <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold leading-none">{new Set(schedules.map((s) => s.teacher_id)).size}</p><p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">Guru Terjadwal</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-card rounded-2xl"><CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /></div>
              <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold leading-none">{subjects.filter((s) => s.is_active).length}</p><p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">Mata Pelajaran</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-card rounded-2xl"><CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" /></div>
              <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold leading-none">{new Set(schedules.map((s) => s.class_id)).size}</p><p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">Kelas Terjadwal</p></div>
            </CardContent></Card>
          </div>

          {/* Schedule by day */}
          {Object.keys(groupedByDay).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada jadwal</p>
              <p className="text-sm">Tambahkan jadwal mengajar untuk guru</p>
            </CardContent></Card>
          ) : (
            Object.entries(groupedByDay).sort(([a], [b]) => Number(a) - Number(b)).map(([day, items]) => (
              <Card key={day} className="border-0 shadow-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 px-3.5 sm:px-6 pt-3.5 sm:pt-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <span className="truncate">{DAYS[Number(day)]}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] sm:text-xs shrink-0">{items.length} jadwal</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">Jam</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Ruangan</TableHead>
                          {isAdmin && <TableHead className="w-20">Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {items.map((s) => {
                          const isMe = s.teacher_id === user?.id;
                          return (
                          <TableRow key={s.id} className={cn(isMe && "bg-primary/5 font-medium")}>
                            <TableCell className="font-mono text-sm">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getSubjectColor(s.subject_id) }} />
                                <span className="font-medium">{getSubjectName(s.subject_id)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={cn(isMe && "text-primary font-bold")}>{getTeacherName(s.teacher_id)}</span>
                              {isMe && <Badge className="ml-1.5 bg-primary/15 text-primary border-primary/30 text-[9px] h-4 px-1">Anda</Badge>}
                            </TableCell>
                            <TableCell><Badge variant="outline">{getClassName(s.class_id)}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{s.room || "—"}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSchedule(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSchedule(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2">
                    {items.map((s) => {
                      const isMe = s.teacher_id === user?.id;
                      const subjColor = getSubjectColor(s.subject_id);
                      return (
                      <div key={s.id} className={cn(
                        "relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm transition-all active:scale-[0.99]",
                        isMe && "border-primary/40 ring-1 ring-primary/20 bg-primary/[0.03]"
                      )}>
                        {/* Colored subject rail */}
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: subjColor }} aria-hidden />
                        <div className="pl-3 pr-2.5 py-2.5 space-y-2">
                          {/* Top row: time pill + actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 ring-1 ring-border/50">
                              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-mono text-[11px] font-semibold tracking-tight">
                                {s.start_time.slice(0, 5)}<span className="mx-1 text-muted-foreground/60">–</span>{s.end_time.slice(0, 5)}
                              </span>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-0.5 shrink-0">
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEditSchedule(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive" onClick={() => deleteSchedule(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            )}
                          </div>

                          {/* Subject title */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: subjColor }} />
                            <p className="text-sm font-bold truncate flex-1">{getSubjectName(s.subject_id)}</p>
                            {isMe && <Badge className="bg-primary/15 text-primary border-primary/30 text-[9px] h-4 px-1.5 shrink-0">Anda</Badge>}
                          </div>

                          {/* Info chips — wrap nicely on small screens */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground max-w-full",
                              isMe && "bg-primary/10 text-primary"
                            )}>
                              <UsersIcon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{getTeacherName(s.teacher_id)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <GraduationCap className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate max-w-[100px]">{getClassName(s.class_id)}</span>
                            </span>
                            {s.room && (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                <BookOpen className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate max-w-[100px]">{s.room}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ===== SUBJECTS TAB ===== */}
        {isAdmin && (
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Daftar Mata Pelajaran</h3>
              <Dialog open={subjectDialog} onOpenChange={(o) => { setSubjectDialog(o); if (!o) { setEditingSubject(null); setSubjectForm({ name: "", code: "", color: "#3B82F6" }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Tambah Mapel</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingSubject ? "Edit Mapel" : "Tambah Mata Pelajaran"}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div><Label>Nama Mapel *</Label><Input placeholder="Contoh: Matematika" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} /></div>
                    <div><Label>Kode</Label><Input placeholder="Contoh: MTK" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} /></div>
                    <div><Label>Warna Label</Label><Input type="color" className="h-10 w-20 p-1" value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })} /></div>
                    <Button onClick={saveSubject} className="w-full">{editingSubject ? "Simpan" : "Tambah"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <Card key={s.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: s.color || "#3B82F6" }} />
                  <CardContent className="p-4 pl-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      {s.code && <p className="text-xs text-muted-foreground">Kode: {s.code}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingSubject(s); setSubjectForm({ name: s.name, code: s.code || "", color: s.color || "#3B82F6" }); setSubjectDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSubject(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {subjects.length === 0 && (
                <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada mata pelajaran</p>
                </CardContent></Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
