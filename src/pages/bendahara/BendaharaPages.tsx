import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp, Wallet, AlertCircle, CheckCircle2, Loader2, Plus, Search, Link as LinkIcon,
  Receipt, ArrowDownToLine, Banknote, RefreshCw, FileText, MessageCircle, Mail, Copy,
  Download, Upload, ArrowLeft, User, ChevronRight, Eye,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const fmtIDR = (n: number) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// Helper: hitung tahun ajaran (Juli-Juni). Bulan 7-12 = year/year+1, bulan 1-6 = year-1/year
const academicYearOf = (month: number, year: number) => {
  if (month >= 7) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
};
const academicYearList = (currentYear: number) => {
  const arr: string[] = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) arr.push(`${y}/${y + 1}`);
  return arr;
};
const monthsOfAcademicYear = (ay: string): { month: number; year: number; label: string }[] => {
  const [y1, y2] = ay.split("/").map(Number);
  const arr: { month: number; year: number; label: string }[] = [];
  for (let m = 7; m <= 12; m++) arr.push({ month: m, year: y1, label: `${MONTHS[m - 1]} ${y1}` });
  for (let m = 1; m <= 6; m++) arr.push({ month: m, year: y2, label: `${MONTHS[m - 1]} ${y2}` });
  return arr;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    paid: { c: "bg-emerald-500 hover:bg-emerald-500", t: "Lunas" },
    pending: { c: "bg-amber-500 hover:bg-amber-500", t: "Pending" },
    unpaid: { c: "bg-slate-400 hover:bg-slate-400", t: "Belum Bayar" },
    failed: { c: "bg-red-500 hover:bg-red-500", t: "Gagal" },
    expired: { c: "bg-slate-500 hover:bg-slate-500", t: "Expired" },
  };
  const v = map[status] || map.unpaid;
  return <Badge className={`${v.c} text-white`}>{v.t}</Badge>;
};

function StatCard({ label, value, icon: Icon, gradient = "from-emerald-500 to-teal-600", sub }: any) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-extrabold mt-1 truncate">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ DASHBOARD ============
export function BendaharaDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id),
      supabase.from("spp_settlements").select("*").eq("school_id", profile.school_id),
    ]).then(([i, s]) => {
      setInvoices(i.data || []);
      setSettlements(s.data || []);
      setLoading(false);
    });
  }, [profile?.school_id]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthInv = invoices.filter(i => i.period_year === now.getFullYear() && i.period_month === now.getMonth() + 1);
    const paid = invoices.filter(i => i.status === "paid");
    const pending = invoices.filter(i => i.status === "pending");
    const totalGross = paid.reduce((s, i) => s + (i.total_amount || 0), 0);
    const totalFee = paid.reduce((s, i) => s + (i.gateway_fee || 0), 0);
    const totalNet = paid.reduce((s, i) => s + (i.net_amount || 0), 0);
    const settled = settlements.filter(s => s.status === "paid").reduce((s, x) => s + (x.final_payout || 0), 0);
    const settleFee = settlements.filter(s => s.status === "paid").length * 3000;
    const availableBalance = totalNet - settlements.filter(s => ["pending","approved","paid"].includes(s.status)).reduce((s, x) => s + (x.total_net || 0), 0);
    return {
      monthBills: monthInv.reduce((s, i) => s + (i.total_amount || 0), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      tunggakan: pending.filter(i => new Date(i.due_date) < now).reduce((s, i) => s + (i.total_amount || 0), 0),
      totalGross, totalFee, totalNet, settled, settleFee,
      availableBalance: Math.max(0, availableBalance),
      pendingBalance: pending.reduce((s, i) => s + (i.total_amount || 0), 0),
    };
  }, [invoices, settlements]);

  const monthlyChart = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.status === "paid" && i.paid_at).forEach(i => {
      const d = new Date(i.paid_at);
      const k = `${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear().toString().slice(2)}`;
      map[k] = (map[k] || 0) + (i.total_amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).slice(-6);
  }, [invoices]);

  const classChart = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.status === "paid").forEach(i => {
      map[i.class_name] = (map[i.class_name] || 0) + (i.total_amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const tunggakanList = useMemo(() => {
    const now = new Date();
    const map = new Map<string, { name: string; class: string; total: number; count: number }>();
    invoices.filter(i => i.status === "pending" && new Date(i.due_date) < now).forEach(i => {
      const e = map.get(i.student_id) || { name: i.student_name, class: i.class_name, total: 0, count: 0 };
      e.total += i.total_amount || 0; e.count += 1;
      map.set(i.student_id, e);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [invoices]);

  const completionRate = useMemo(() => {
    if (invoices.length === 0) return 0;
    return Math.round((invoices.filter(i => i.status === "paid").length / invoices.length) * 100);
  }, [invoices]);

  if (loading) return <div className="p-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard Bendahara</h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuangan sekolah</p>
      </div>

      {/* PRIMARY ROW: 4 KPI utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tagihan Bulan Ini" value={fmtIDR(stats.monthBills)} icon={Receipt} gradient="from-violet-500 to-purple-600" />
        <StatCard label="Pendapatan Kotor" value={fmtIDR(stats.totalGross)} icon={TrendingUp} gradient="from-blue-500 to-indigo-600" sub={`${stats.paidCount} transaksi`} />
        <StatCard label="Saldo Bisa Cair" value={fmtIDR(stats.availableBalance)} icon={Wallet} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Tunggakan" value={fmtIDR(stats.tunggakan)} icon={AlertCircle} gradient="from-red-500 to-rose-600" sub={`${stats.pendingCount} pending`} />
      </div>

      {/* Persentase pelunasan */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Persentase Pelunasan</p>
              <p className="text-2xl font-extrabold text-emerald-600">{completionRate}%</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-emerald-500/30" />
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Pembayaran Bulanan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}jt`} />
                <Tooltip formatter={(v: any) => fmtIDR(v)} />
                <Line type="monotone" dataKey="value" stroke="hsl(160 84% 39%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Pembayaran per Kelas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={classChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}jt`} />
                <Tooltip formatter={(v: any) => fmtIDR(v)} />
                <Bar dataKey="value" fill="hsl(160 84% 39%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY: detail keuangan dalam satu card ringkas */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Rincian Keuangan</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div><p className="text-[11px] text-muted-foreground">Pendapatan Net</p><p className="font-bold text-emerald-600">{fmtIDR(stats.totalNet)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Fee Gateway</p><p className="font-bold">{fmtIDR(stats.totalFee)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Fee Pencairan</p><p className="font-bold">{fmtIDR(stats.settleFee)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Saldo Pending</p><p className="font-bold text-amber-600">{fmtIDR(stats.pendingBalance)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Sudah Dicairkan</p><p className="font-bold">{fmtIDR(stats.settled)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Siswa Menunggak */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" /> Siswa Menunggak</CardTitle>
          <Badge variant="secondary">{tunggakanList.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {tunggakanList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada tunggakan</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Bulan Nunggak</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {tunggakanList.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="secondary">{t.class}</Badge></TableCell>
                    <TableCell>{t.count} bulan</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{fmtIDR(t.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DATA SISWA ============
export function BendaharaSiswa() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("*").eq("school_id", profile.school_id),
      supabase.from("spp_invoices").select("student_id, status, total_amount").eq("school_id", profile.school_id),
    ]).then(([s, i]) => {
      setStudents(s.data || []);
      setInvoices(i.data || []);
      setLoading(false);
    });
  }, [profile?.school_id]);

  const enriched = useMemo(() => {
    const map = new Map<string, { paid: number; pending: number; tunggakan: number }>();
    invoices.forEach(i => {
      const e = map.get(i.student_id) || { paid: 0, pending: 0, tunggakan: 0 };
      if (i.status === "paid") e.paid++;
      else { e.pending++; e.tunggakan += i.total_amount || 0; }
      map.set(i.student_id, e);
    });
    return students
      .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.includes(search))
      .map(s => ({ ...s, ...(map.get(s.id) || { paid: 0, pending: 0, tunggakan: 0 }) }));
  }, [students, invoices, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Data Siswa Keuangan</h1>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama / NIS" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Wali</TableHead>
                  <TableHead>WhatsApp</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Tunggakan</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {enriched.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>}
                  {enriched.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700">{s.name[0]}</div>
                          <div><p className="text-sm font-semibold">{s.name}</p><p className="text-[11px] text-muted-foreground">NIS {s.student_id}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{s.class}</Badge></TableCell>
                      <TableCell className="text-sm">{s.parent_name}</TableCell>
                      <TableCell className="text-xs">{s.parent_phone}</TableCell>
                      <TableCell>{s.tunggakan > 0 ? <Badge className="bg-red-500">Tunggakan</Badge> : <Badge className="bg-emerald-500">Lunas</Badge>}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtIDR(s.tunggakan)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TARIF SPP ============
export function BendaharaTarif() {
  const { profile } = useAuth();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ school_year: "2025/2026", class_name: "", amount: 0, due_date_day: 10, denda: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("spp_tariffs").select("*").eq("school_id", profile.school_id).order("class_name"),
      supabase.from("classes").select("name").eq("school_id", profile.school_id),
    ]).then(([t, c]) => {
      setTariffs(t.data || []);
      setClasses((c.data || []).map((x: any) => x.name));
      setLoading(false);
    });
  };
  useEffect(load, [profile?.school_id]);

  const save = async () => {
    if (!form.class_name || form.amount <= 0) { toast.error("Lengkapi data"); return; }
    const { error } = await supabase.from("spp_tariffs").upsert({ school_id: profile!.school_id, ...form }, { onConflict: "school_id,school_year,class_name" });
    if (error) toast.error(error.message); else { toast.success("Tarif tersimpan"); setOpen(false); load(); }
  };

  const toggle = async (t: any) => {
    await supabase.from("spp_tariffs").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Tarif SPP</h1>
        <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Tahun Ajaran</TableHead><TableHead>Kelas</TableHead><TableHead>Nominal</TableHead><TableHead>Due Date</TableHead><TableHead>Denda</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {tariffs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada tarif</TableCell></TableRow>}
                {tariffs.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.school_year}</TableCell>
                    <TableCell><Badge variant="secondary">{t.class_name}</Badge></TableCell>
                    <TableCell className="font-semibold">{fmtIDR(t.amount)}</TableCell>
                    <TableCell>Tanggal {t.due_date_day}</TableCell>
                    <TableCell>{fmtIDR(t.denda)}</TableCell>
                    <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggle(t)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Tarif SPP</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tahun Ajaran</Label><Input value={form.school_year} onChange={e => setForm({ ...form, school_year: e.target.value })} /></div>
            <div><Label>Kelas</Label>
              <Select value={form.class_name} onValueChange={v => setForm({ ...form, class_name: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nominal SPP (Rp)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Due Date (tgl)</Label><Input type="number" min={1} max={28} value={form.due_date_day} onChange={e => setForm({ ...form, due_date_day: parseInt(e.target.value) || 10 })} /></div>
              <div><Label>Denda (Rp)</Label><Input type="number" value={form.denda} onChange={e => setForm({ ...form, denda: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <Button onClick={save} className="w-full bg-emerald-600">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ GENERATE TAGIHAN ============
export function BendaharaGenerate() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<string[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([
      supabase.from("classes").select("name").eq("school_id", profile.school_id),
      supabase.from("spp_tariffs").select("*").eq("school_id", profile.school_id).eq("is_active", true),
    ]).then(([c, t]) => {
      setClasses((c.data || []).map((x: any) => x.name));
      setTariffs(t.data || []);
    });
  }, [profile?.school_id]);

  const generate = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    try {
      const q = supabase.from("students").select("*").eq("school_id", profile.school_id);
      const { data: students } = selectedClass ? await q.eq("class", selectedClass) : await q;
      if (!students || students.length === 0) { toast.error("Tidak ada siswa"); return; }

      const periodLabel = `${MONTHS[month - 1]} ${year}`;
      const rows: any[] = [];
      for (const s of students) {
        const tariff = tariffs.find(t => t.class_name === s.class);
        if (!tariff) continue;
        const due = new Date(year, month - 1, tariff.due_date_day);
        rows.push({
          school_id: profile.school_id,
          student_id: s.id,
          invoice_number: `SPP/${year}${String(month).padStart(2,"0")}/${s.student_id}`,
          student_name: s.name,
          class_name: s.class,
          parent_name: s.parent_name,
          parent_phone: s.parent_phone,
          period_month: month, period_year: year, period_label: periodLabel,
          description: `${s.name} - ${s.class} - ${periodLabel}`,
          amount: tariff.amount,
          denda: 0,
          total_amount: tariff.amount,
          due_date: due.toISOString().slice(0,10),
        });
      }
      if (rows.length === 0) { toast.error("Tidak ada tarif aktif untuk siswa terpilih"); return; }
      const { error } = await supabase.from("spp_invoices").upsert(rows, { onConflict: "school_id,student_id,period_year,period_month", ignoreDuplicates: true });
      if (error) toast.error(error.message); else toast.success(`${rows.length} tagihan dibuat untuk ${periodLabel}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Generate Tagihan SPP</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Bulan</Label>
              <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tahun</Label><Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} /></div>
            <div><Label>Kelas (opsional)</Label>
              <Select value={selectedClass || "all"} onValueChange={v => setSelectedClass(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Semua kelas</SelectItem>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            Format deskripsi tagihan: <strong>NAMA SISWA - KELAS - BULAN TAHUN</strong> (digunakan di Mayar, dashboard wali murid, dan WhatsApp).
          </div>
          <Button onClick={generate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Generate Tagihan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SPP PER SISWA (LIST) ============
export function BendaharaTransaksi() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentAY = academicYearOf(new Date().getMonth() + 1, currentYear);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterAY, setFilterAY] = useState(currentAY);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "tunggakan" | "lunas">("name");

  const load = () => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("id, name, student_id, class, parent_name, parent_phone").eq("school_id", profile.school_id),
      supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id),
      supabase.from("classes").select("name").eq("school_id", profile.school_id),
    ]).then(([s, i, c]) => {
      setStudents(s.data || []);
      setInvoices(i.data || []);
      setClasses((c.data || []).map((x: any) => x.name));
      setLoading(false);
    });
  };
  useEffect(load, [profile?.school_id]);

  const ayMonths = useMemo(() => monthsOfAcademicYear(filterAY), [filterAY]);

  const enriched = useMemo(() => {
    return students.map(s => {
      const studentInvs = invoices.filter(inv => {
        if (inv.student_id !== s.id) return false;
        const ay = academicYearOf(inv.period_month, inv.period_year);
        if (ay !== filterAY) return false;
        if (filterMonth !== "all" && inv.period_month !== parseInt(filterMonth)) return false;
        return true;
      });
      const lunas = studentInvs.filter(i => i.status === "paid").length;
      const pending = studentInvs.filter(i => i.status === "pending").length;
      const total = studentInvs.length;
      const totalTagihan = studentInvs.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const totalBayar = studentInvs.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const sisa = totalTagihan - totalBayar;
      // Status agregat siswa
      let aggStatus = "unpaid";
      if (total > 0 && lunas === total) aggStatus = "paid";
      else if (pending > 0) aggStatus = "pending";
      else if (lunas > 0) aggStatus = "pending";
      return { ...s, lunas, pending, total, totalTagihan, totalBayar, sisa, aggStatus };
    })
    .filter(s => filterClass === "all" || s.class === filterClass)
    .filter(s => filterStatus === "all" || s.aggStatus === filterStatus)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.student_id || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "tunggakan") return b.sisa - a.sisa;
      if (sortBy === "lunas") return b.lunas - a.lunas;
      return a.name.localeCompare(b.name);
    });
  }, [students, invoices, filterClass, filterAY, filterStatus, filterMonth, search, sortBy]);

  const summary = useMemo(() => ({
    total: enriched.length,
    lunas: enriched.filter(s => s.aggStatus === "paid").length,
    nunggak: enriched.filter(s => s.sisa > 0).length,
    totalSisa: enriched.reduce((s, x) => s + x.sisa, 0),
  }), [enriched]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Pembayaran SPP</h1>
          <p className="text-sm text-muted-foreground">Per siswa, per tahun ajaran, per bulan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/bendahara/import-export")}>
            <Upload className="h-4 w-4 mr-2" /> Import / Export
          </Button>
        </div>
      </div>

      {/* Summary mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Siswa" value={summary.total} icon={User} gradient="from-slate-500 to-slate-700" />
        <StatCard label="Sudah Lunas" value={summary.lunas} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Menunggak" value={summary.nunggak} icon={AlertCircle} gradient="from-red-500 to-rose-600" />
        <StatCard label="Total Sisa Tagihan" value={fmtIDR(summary.totalSisa)} icon={Wallet} gradient="from-amber-500 to-orange-600" />
      </div>

      {/* Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari nama / NIS" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAY} onValueChange={setFilterAY}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {academicYearList(currentYear).map(ay => <SelectItem key={ay} value={ay}>{ay}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger><SelectValue placeholder="Bulan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unpaid">Belum Bayar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Urutkan:</span>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama (A-Z)</SelectItem>
                <SelectItem value="tunggakan">Tunggakan terbesar</SelectItem>
                <SelectItem value="lunas">Bulan lunas terbanyak</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Wali</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Sisa Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {enriched.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    Tidak ada data sesuai filter
                  </TableCell></TableRow>}
                  {enriched.map(s => {
                    const pct = s.total > 0 ? Math.round((s.lunas / s.total) * 100) : 0;
                    return (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/bendahara/transaksi/${s.id}?ay=${encodeURIComponent(filterAY)}`)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700">{s.name[0]}</div>
                            <div><p className="text-sm font-semibold">{s.name}</p><p className="text-[11px] text-muted-foreground">NIS {s.student_id}</p></div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{s.class}</Badge></TableCell>
                        <TableCell className="text-xs"><p>{s.parent_name || "-"}</p><p className="text-muted-foreground">{s.parent_phone || ""}</p></TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-medium">{s.lunas}/{s.total} bulan</span>
                              <span className="text-muted-foreground">{pct}%</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{s.sisa > 0 ? <span className="text-red-600">{fmtIDR(s.sisa)}</span> : <span className="text-emerald-600">Lunas</span>}</TableCell>
                        <TableCell><StatusBadge status={s.aggStatus} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" /> Detail</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SPP DETAIL PER SISWA ============
export function BendaharaSPPDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const search = new URLSearchParams(window.location.search);
  const initAY = search.get("ay") || academicYearOf(new Date().getMonth() + 1, new Date().getFullYear());

  const [student, setStudent] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [ay, setAY] = useState(initAY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    if (!profile?.school_id || !studentId) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
      supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id).eq("student_id", studentId),
      supabase.from("spp_tariffs").select("*").eq("school_id", profile.school_id).eq("is_active", true),
    ]).then(([s, i, t]) => {
      setStudent(s.data); setInvoices(i.data || []); setTariffs(t.data || []); setLoading(false);
    });
  };
  useEffect(load, [profile?.school_id, studentId]);

  const ayMonths = useMemo(() => monthsOfAcademicYear(ay), [ay]);

  const grid = useMemo(() => ayMonths.map(m => {
    const inv = invoices.find(x => x.period_month === m.month && x.period_year === m.year);
    return { ...m, inv };
  }), [ayMonths, invoices]);

  const stats = useMemo(() => {
    const yearInvs = invoices.filter(i => {
      const a = academicYearOf(i.period_month, i.period_year);
      return a === ay;
    });
    const totalTagihan = yearInvs.reduce((s, i) => s + (i.total_amount || 0), 0);
    const totalBayar = yearInvs.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
    return { totalTagihan, totalBayar, sisa: totalTagihan - totalBayar, lunas: yearInvs.filter(i => i.status === "paid").length, total: yearInvs.length };
  }, [invoices, ay]);

  const pct = stats.total > 0 ? Math.round((stats.lunas / stats.total) * 100) : 0;

  const createInvoiceFor = async (month: number, year: number) => {
    if (!student || !profile?.school_id) return;
    const tariff = tariffs.find(t => t.class_name === student.class);
    if (!tariff) { toast.error("Tarif untuk kelas ini belum diatur"); return; }
    setBusy(`create-${month}-${year}`);
    const due = new Date(year, month - 1, tariff.due_date_day);
    const periodLabel = `${MONTHS[month - 1]} ${year}`;
    const { error } = await supabase.from("spp_invoices").insert({
      school_id: profile.school_id, student_id: student.id,
      invoice_number: `SPP/${year}${String(month).padStart(2,"0")}/${student.student_id}`,
      student_name: student.name, class_name: student.class,
      parent_name: student.parent_name, parent_phone: student.parent_phone,
      period_month: month, period_year: year, period_label: periodLabel,
      description: `${student.name} - ${student.class} - ${periodLabel}`,
      amount: tariff.amount, denda: 0, total_amount: tariff.amount,
      due_date: due.toISOString().slice(0, 10),
    });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success("Tagihan dibuat"); load(); }
  };

  const createPaymentLink = async (inv: any) => {
    setBusy(`link-${inv.id}`);
    toast.loading("Membuat link Mayar...");
    const { data, error } = await supabase.functions.invoke("spp-mayar", { body: { action: "create_payment_link", invoice_id: inv.id } });
    toast.dismiss();
    setBusy(null);
    if (error || !data?.success) { toast.error(data?.error || error?.message || "Gagal"); return; }
    if (data.payment_url) { toast.success("Link berhasil dibuat"); load(); }
  };

  const copyLink = (url: string) => { navigator.clipboard.writeText(url); toast.success("Link disalin"); };

  const sendWa = async (inv: any) => {
    if (!inv.parent_phone) { toast.error("Wali murid tidak punya nomor WA"); return; }
    if (!inv.payment_url) { toast.error("Buat link pembayaran dulu"); return; }
    const msg = `Yth. Bapak/Ibu *${inv.parent_name || "Wali"}*,\n\nTagihan SPP siswa *${inv.student_name}* (${inv.class_name}) periode *${inv.period_label}* sebesar *${fmtIDR(inv.total_amount)}*.\n\nSilakan bayar melalui link:\n${inv.payment_url}\n\nJatuh tempo: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "-"}\n\nTerima kasih.\n_ATSkolla_`;
    setBusy(`wa-${inv.id}`);
    toast.loading("Mengirim WA...");
    const { error } = await supabase.functions.invoke("send-whatsapp", {
      body: { school_id: profile!.school_id, phone: inv.parent_phone, message: msg, message_type: "spp_invoice" },
    });
    toast.dismiss(); setBusy(null);
    if (error) toast.error("Gagal kirim"); else toast.success("Terkirim ke WA wali");
  };

  const sendEmail = (inv: any) => {
    if (!inv.payment_url) { toast.error("Buat link dulu"); return; }
    const subject = `Tagihan SPP ${inv.period_label} - ${inv.student_name}`;
    const body = `Yth. ${inv.parent_name || "Wali"},\n\nTagihan SPP ${inv.student_name} (${inv.class_name}) periode ${inv.period_label}: ${fmtIDR(inv.total_amount)}.\n\nLink: ${inv.payment_url}\n\nTerima kasih.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!student) return <div className="p-12 text-center text-muted-foreground">Siswa tidak ditemukan</div>;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/bendahara/transaksi")}><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button>

      {/* Header siswa */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
              {student.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold truncate">{student.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-muted-foreground mt-1">
                <span>NIS: <strong className="text-foreground">{student.student_id}</strong></span>
                {student.nisn && <span>NISN: <strong className="text-foreground">{student.nisn}</strong></span>}
                <span>Kelas: <Badge variant="secondary">{student.class}</Badge></span>
                <span>Wali: <strong className="text-foreground">{student.parent_name || "-"}</strong></span>
                {student.parent_phone && <span>WA: <strong className="text-foreground">{student.parent_phone}</strong></span>}
              </div>
            </div>
            <Select value={ay} onValueChange={setAY}>
              <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {academicYearList(new Date().getFullYear()).map(a => <SelectItem key={a} value={a}>TA {a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Progress tahunan */}
          <div className="mt-5 grid md:grid-cols-4 gap-3">
            <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground">Total Tagihan TA</p>
              <p className="text-lg font-extrabold">{fmtIDR(stats.totalTagihan)}</p>
            </div>
            <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground">Sudah Dibayar</p>
              <p className="text-lg font-extrabold text-emerald-600">{fmtIDR(stats.totalBayar)}</p>
            </div>
            <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground">Sisa Tagihan</p>
              <p className="text-lg font-extrabold text-red-600">{fmtIDR(stats.sisa)}</p>
            </div>
            <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground">Pelunasan</p>
              <p className="text-lg font-extrabold">{pct}%</p>
              <Progress value={pct} className="h-1.5 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid 12 bulan */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Status Per Bulan – TA {ay}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {grid.map(g => {
              const status = g.inv?.status || "unpaid";
              const colorMap: any = {
                paid: "border-emerald-500/40 bg-emerald-500/5",
                pending: "border-amber-500/40 bg-amber-500/5",
                unpaid: "border-slate-300 dark:border-slate-700",
                failed: "border-red-500/40 bg-red-500/5",
              };
              return (
                <div key={`${g.year}-${g.month}`} className={`relative rounded-xl border-2 p-3 ${colorMap[status]}`}>
                  <p className="text-[11px] font-bold text-muted-foreground">{MONTHS[g.month - 1]}</p>
                  <p className="text-[10px] text-muted-foreground">{g.year}</p>
                  <div className="mt-2"><StatusBadge status={status} /></div>
                  {g.inv && <p className="text-xs font-semibold mt-2">{fmtIDR(g.inv.total_amount)}</p>}
                  {!g.inv && <Button size="sm" variant="outline" className="mt-2 w-full text-[10px] h-7" disabled={busy === `create-${g.month}-${g.year}`} onClick={() => createInvoiceFor(g.month, g.year)}>
                    {busy === `create-${g.month}-${g.year}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "+ Buat"}
                  </Button>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabel riwayat */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Riwayat Pembayaran</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Bulan</TableHead><TableHead>Invoice</TableHead><TableHead>Nominal</TableHead>
                <TableHead>Tgl Bayar</TableHead><TableHead>Metode</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {grid.filter(g => g.inv).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada tagihan</TableCell></TableRow>}
                {grid.filter(g => g.inv).map(g => {
                  const inv = g.inv;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">{g.label}</TableCell>
                      <TableCell className="text-xs font-mono">{inv.invoice_number}</TableCell>
                      <TableCell className="font-semibold">{fmtIDR(inv.total_amount)}</TableCell>
                      <TableCell className="text-xs">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell className="text-xs">{inv.payment_method || "-"}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {!inv.payment_url ? (
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy === `link-${inv.id}`} onClick={() => createPaymentLink(inv)}>
                                {busy === `link-${inv.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <><LinkIcon className="h-3 w-3 mr-1" /> Buat Link</>}
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => copyLink(inv.payment_url)}><Copy className="h-3 w-3" /></Button>
                                <Button size="sm" variant="outline" onClick={() => window.open(inv.payment_url, "_blank")}><LinkIcon className="h-3 w-3" /></Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy === `wa-${inv.id}`} onClick={() => sendWa(inv)}><MessageCircle className="h-3 w-3 mr-1" /> WA</Button>
                                <Button size="sm" variant="outline" onClick={() => sendEmail(inv)}><Mail className="h-3 w-3" /></Button>
                              </>
                            )}
                          </div>
                        ) : inv.status === "paid" ? (
                          <Button size="sm" variant="ghost" className="text-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Lunas</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ IMPORT / EXPORT ============
export function BendaharaImportExport() {
  const { profile } = useAuth();
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validRows, setValidRows] = useState<any[]>([]);
  const [errorRows, setErrorRows] = useState<{ row: number; error: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from("students").select("id, name, student_id, class").eq("school_id", profile.school_id).then(({ data }) => setStudents(data || []));
  }, [profile?.school_id]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["nis", "nama_siswa", "kelas", "tahun_ajaran", "bulan", "tahun", "nominal", "tanggal_jatuh_tempo"],
      ["12345", "Ahmad Fauzan", "VII A", "2026/2027", "1", "2027", "150000", "2027-01-10"],
      ["12346", "Siti Nurhaliza", "VII A", "2026/2027", "1", "2027", "150000", "2027-01-10"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template SPP");
    XLSX.writeFile(wb, "template-import-spp.xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
        setPreviewRows(json);

        const valid: any[] = [];
        const errors: { row: number; error: string }[] = [];
        json.forEach((r, idx) => {
          const rowNum = idx + 2;
          const nis = String(r.nis || "").trim();
          const month = parseInt(r.bulan);
          const year = parseInt(r.tahun);
          const nominal = parseInt(r.nominal);
          if (!nis) return errors.push({ row: rowNum, error: "NIS kosong" });
          if (!month || month < 1 || month > 12) return errors.push({ row: rowNum, error: "Bulan tidak valid" });
          if (!year || year < 2020) return errors.push({ row: rowNum, error: "Tahun tidak valid" });
          if (!nominal || nominal <= 0) return errors.push({ row: rowNum, error: "Nominal tidak valid" });
          const student = students.find(s => s.student_id === nis);
          if (!student) return errors.push({ row: rowNum, error: `Siswa NIS ${nis} tidak ditemukan` });
          valid.push({ ...r, _student: student, _month: month, _year: year, _nominal: nominal });
        });
        setValidRows(valid);
        setErrorRows(errors);
      } catch (err: any) {
        toast.error("Gagal membaca file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submitImport = async () => {
    if (validRows.length === 0) { toast.error("Tidak ada data valid"); return; }
    setImporting(true);
    const rows = validRows.map(r => {
      const dueDate = r.tanggal_jatuh_tempo ? new Date(r.tanggal_jatuh_tempo) : new Date(r._year, r._month - 1, 10);
      const label = `${MONTHS[r._month - 1]} ${r._year}`;
      return {
        school_id: profile!.school_id,
        student_id: r._student.id,
        invoice_number: `SPP/${r._year}${String(r._month).padStart(2,"0")}/${r._student.student_id}`,
        student_name: r._student.name,
        class_name: r._student.class,
        parent_name: r.nama_wali || null,
        parent_phone: r.no_wa_wali || null,
        period_month: r._month, period_year: r._year, period_label: label,
        description: `${r._student.name} - ${r._student.class} - ${label}`,
        amount: r._nominal, denda: 0, total_amount: r._nominal,
        due_date: dueDate.toISOString().slice(0, 10),
      };
    });
    const { error } = await supabase.from("spp_invoices").upsert(rows, { onConflict: "school_id,student_id,period_year,period_month", ignoreDuplicates: true });
    setImporting(false);
    if (error) toast.error(error.message);
    else { toast.success(`${rows.length} tagihan berhasil di-import`); setPreviewRows([]); setValidRows([]); setErrorRows([]); }
  };

  const exportData = async (format: "xlsx" | "csv" | "pdf") => {
    if (!profile?.school_id) return;
    toast.loading("Menyiapkan export...");
    const { data: invs } = await supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id).order("period_year").order("period_month");
    toast.dismiss();
    if (!invs || invs.length === 0) { toast.error("Tidak ada data"); return; }

    const rows = invs.map(i => ({
      Invoice: i.invoice_number, Siswa: i.student_name, Kelas: i.class_name,
      Wali: i.parent_name || "", Bulan: i.period_label,
      Nominal: i.total_amount, Status: i.status,
      "Tgl Bayar": i.paid_at ? new Date(i.paid_at).toLocaleDateString("id-ID") : "",
      Metode: i.payment_method || "",
    }));

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SPP");
      XLSX.writeFile(wb, `spp-${new Date().toISOString().slice(0,10)}.xlsx`);
    } else if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `spp-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const doc = new jsPDF();
      doc.text("Laporan SPP", 14, 14);
      (doc as any).autoTable({
        startY: 20,
        head: [Object.keys(rows[0])],
        body: rows.map(r => Object.values(r)),
        styles: { fontSize: 7 },
      });
      doc.save(`spp-${new Date().toISOString().slice(0,10)}.pdf`);
    }
    toast.success("Export selesai");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Import & Export SPP</h1>

      {/* Export */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Export Data</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Unduh seluruh data tagihan SPP.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportData("xlsx")} className="bg-emerald-600 hover:bg-emerald-700"><Download className="h-4 w-4 mr-2" /> Excel</Button>
            <Button onClick={() => exportData("csv")} variant="outline"><Download className="h-4 w-4 mr-2" /> CSV</Button>
            <Button onClick={() => exportData("pdf")} variant="outline"><Download className="h-4 w-4 mr-2" /> PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Import Tagihan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={downloadTemplate}><FileText className="h-4 w-4 mr-2" /> Download Template</Button>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="max-w-xs" />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            Format kolom: <strong>nis, nama_siswa, kelas, tahun_ajaran, bulan, tahun, nominal, tanggal_jatuh_tempo</strong>
          </div>

          {(validRows.length > 0 || errorRows.length > 0) && (
            <>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-emerald-500">Valid: {validRows.length}</Badge>
                {errorRows.length > 0 && <Badge className="bg-red-500">Error: {errorRows.length}</Badge>}
                <Badge variant="secondary">Total baris: {previewRows.length}</Badge>
              </div>

              {errorRows.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 mb-1">Baris gagal:</p>
                  {errorRows.map((e, i) => <p key={i} className="text-[11px] text-red-700">Baris {e.row}: {e.error}</p>)}
                </div>
              )}

              {validRows.length > 0 && (
                <div className="border rounded-lg overflow-x-auto max-h-72">
                  <Table>
                    <TableHeader><TableRow><TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Kelas</TableHead><TableHead>Periode</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {validRows.slice(0, 50).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.nis}</TableCell>
                          <TableCell className="text-xs">{r._student.name}</TableCell>
                          <TableCell className="text-xs">{r._student.class}</TableCell>
                          <TableCell className="text-xs">{MONTHS[r._month - 1]} {r._year}</TableCell>
                          <TableCell className="text-xs font-semibold text-right">{fmtIDR(r._nominal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validRows.length > 50 && <p className="text-[11px] text-center py-2 text-muted-foreground">+{validRows.length - 50} baris lagi…</p>}
                </div>
              )}

              <Button disabled={importing || validRows.length === 0} onClick={submitImport} className="bg-emerald-600 hover:bg-emerald-700">
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Import {validRows.length} Tagihan
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SALDO & LEDGER ============
export function BendaharaSaldo() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id).eq("status", "paid").order("paid_at", { ascending: false }).then(({ data }) => {
      setItems(data || []); setLoading(false);
    });
  }, [profile?.school_id]);

  const totals = items.reduce((acc, i) => ({
    gross: acc.gross + (i.total_amount || 0),
    fee: acc.fee + (i.gateway_fee || 0),
    net: acc.net + (i.net_amount || 0),
  }), { gross: 0, fee: 0, net: 0 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Saldo & Ledger</h1>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Gross Amount" value={fmtIDR(totals.gross)} icon={TrendingUp} gradient="from-blue-500 to-indigo-600" />
        <StatCard label="Gateway Fee" value={fmtIDR(totals.fee)} icon={Banknote} gradient="from-slate-500 to-slate-700" />
        <StatCard label="Net Amount" value={fmtIDR(totals.net)} icon={Wallet} gradient="from-emerald-500 to-teal-600" />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Deskripsi</TableHead><TableHead>Gross</TableHead><TableHead>Fee</TableHead><TableHead>Net</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada transaksi paid</TableCell></TableRow>}
                {items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs">{i.paid_at ? new Date(i.paid_at).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell className="text-xs">{i.description}</TableCell>
                    <TableCell className="text-sm">{fmtIDR(i.total_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtIDR(i.gateway_fee)}</TableCell>
                    <TableCell className="text-sm font-semibold text-emerald-600">{fmtIDR(i.net_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ PENCAIRAN ============
export function BendaharaPencairan() {
  const { profile, user } = useAuth();
  const [available, setAvailable] = useState({ count: 0, gross: 0, fee: 0, net: 0 });
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState({ bank_name: "", account_number: "", account_holder: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([
      supabase.from("spp_invoices").select("total_amount, gateway_fee, net_amount").eq("school_id", profile.school_id).eq("status", "paid").is("settlement_id", null),
    ]).then(([res]) => {
      const items = res.data || [];
      setAvailable({
        count: items.length,
        gross: items.reduce((s, i) => s + (i.total_amount || 0), 0),
        fee: items.reduce((s, i) => s + (i.gateway_fee || 0), 0),
        net: items.reduce((s, i) => s + (i.net_amount || 0), 0),
      });
    });
  }, [profile?.school_id, open]);

  const finalPayout = Math.max(0, available.net - 3000);

  const submit = async () => {
    if (available.count === 0) { toast.error("Tidak ada saldo"); return; }
    if (!bank.bank_name || !bank.account_number || !bank.account_holder) { toast.error("Lengkapi data rekening"); return; }
    setSubmitting(true);
    const code = `STL-${Date.now().toString().slice(-8)}`;
    const { data: settlement, error } = await supabase.from("spp_settlements").insert({
      school_id: profile!.school_id, settlement_code: code,
      total_transactions: available.count, total_gross: available.gross,
      total_gateway_fee: available.fee, total_net: available.net,
      withdraw_fee: 3000, final_payout: finalPayout,
      ...bank, requested_by: user?.id,
    }).select().single();
    if (error || !settlement) { toast.error(error?.message || "Gagal"); setSubmitting(false); return; }
    // Mark invoices
    await supabase.from("spp_invoices").update({ settlement_id: settlement.id })
      .eq("school_id", profile!.school_id).eq("status", "paid").is("settlement_id", null);
    toast.success("Pencairan diajukan, menunggu persetujuan Super Admin");
    setOpen(false); setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Pencairan Dana</h1>
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardHeader><CardTitle className="text-base">Preview Pencairan</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Total Transaksi</p><p className="font-bold">{available.count}</p></div>
            <div><p className="text-xs text-muted-foreground">Total Bruto</p><p className="font-bold">{fmtIDR(available.gross)}</p></div>
            <div><p className="text-xs text-muted-foreground">Fee Gateway</p><p className="font-bold">{fmtIDR(available.fee)}</p></div>
            <div><p className="text-xs text-muted-foreground">Total Net</p><p className="font-bold">{fmtIDR(available.net)}</p></div>
            <div><p className="text-xs text-muted-foreground">Fee Pencairan</p><p className="font-bold">- {fmtIDR(3000)}</p></div>
            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3">
              <p className="text-xs text-muted-foreground">Final Payout</p>
              <p className="text-xl font-extrabold text-emerald-600">{fmtIDR(finalPayout)}</p>
            </div>
          </div>
          <Button disabled={available.count === 0} onClick={() => setOpen(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 mt-2">
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Ajukan Pencairan
          </Button>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pengajuan Pencairan Dana</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Bank</Label><Input value={bank.bank_name} onChange={e => setBank({ ...bank, bank_name: e.target.value })} placeholder="BCA / BRI / Mandiri" /></div>
            <div><Label>Nomor Rekening</Label><Input value={bank.account_number} onChange={e => setBank({ ...bank, account_number: e.target.value })} /></div>
            <div><Label>Atas Nama</Label><Input value={bank.account_holder} onChange={e => setBank({ ...bank, account_holder: e.target.value })} /></div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg text-sm">
              Final payout: <strong className="text-emerald-600">{fmtIDR(finalPayout)}</strong>
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full bg-emerald-600">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajukan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SETTLEMENT HISTORY ============
export function BendaharaSettlement() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    supabase.from("spp_settlements").select("*").eq("school_id", profile.school_id).order("created_at", { ascending: false }).then(({ data }) => {
      setItems(data || []); setLoading(false);
    });
  }, [profile?.school_id]);

  const badge = (s: string) => {
    const map: any = { pending: "bg-amber-500", approved: "bg-blue-500", paid: "bg-emerald-500", rejected: "bg-red-500" };
    return <Badge className={map[s] || "bg-slate-500"}>{s.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Riwayat Settlement</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Tgl</TableHead><TableHead>Trx</TableHead><TableHead>Gross</TableHead><TableHead>Fee Gw</TableHead><TableHead>Fee Pcr</TableHead><TableHead>Final</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada settlement</TableCell></TableRow>}
                {items.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono">{s.settlement_code}</TableCell>
                    <TableCell className="text-xs">{new Date(s.requested_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{s.total_transactions}</TableCell>
                    <TableCell className="text-xs">{fmtIDR(s.total_gross)}</TableCell>
                    <TableCell className="text-xs">{fmtIDR(s.total_gateway_fee)}</TableCell>
                    <TableCell className="text-xs">{fmtIDR(s.withdraw_fee)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{fmtIDR(s.final_payout)}</TableCell>
                    <TableCell>{badge(s.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ LAPORAN ============
export function BendaharaLaporan() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id).eq("period_year", year).then(({ data }) => setItems(data || []));
  }, [profile?.school_id, year]);

  const monthly = MONTHS.map((m, i) => {
    const filtered = items.filter(x => x.period_month === i + 1);
    return {
      name: m.slice(0,3),
      tagihan: filtered.reduce((s, x) => s + (x.total_amount || 0), 0),
      bayar: filtered.filter(x => x.status === "paid").reduce((s, x) => s + (x.total_amount || 0), 0),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Laporan Keuangan</h1>
        <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-32" />
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Tagihan vs Pembayaran ({year})</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(v: any) => fmtIDR(v)} />
              <Legend />
              <Bar dataKey="tagihan" fill="hsl(220 80% 60%)" name="Tagihan" radius={[4,4,0,0]} />
              <Bar dataKey="bayar" fill="hsl(160 84% 39%)" name="Pembayaran" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Payment gateway settings dipindah ke Super Admin (mayar webhook).

