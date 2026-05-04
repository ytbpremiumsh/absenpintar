import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp, Wallet, AlertCircle, CheckCircle2, Loader2, Plus, Search, Link as LinkIcon,
  Receipt, ArrowDownToLine, Banknote, RefreshCw, FileText, MessageCircle,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const fmtIDR = (n: number) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

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

// ============ TRANSAKSI ============
export function BendaharaTransaksi() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!profile?.school_id) { setLoading(false); return; }
    supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id).order("created_at", { ascending: false }).then(({ data }) => {
      setItems(data || []); setLoading(false);
    });
  };
  useEffect(load, [profile?.school_id]);

  const createLink = async (invoiceId: string) => {
    toast.loading("Membuat link Mayar...");
    const { data, error } = await supabase.functions.invoke("spp-mayar", { body: { action: "create_payment_link", invoice_id: invoiceId } });
    toast.dismiss();
    if (error || !data?.success) { toast.error(data?.error || error?.message || "Gagal"); return; }
    if (data.payment_url) { window.open(data.payment_url, "_blank"); toast.success("Link dibuat"); load(); }
  };

  const filtered = items.filter(i =>
    (filter === "all" || i.status === filter) &&
    (!search || i.student_name.toLowerCase().includes(search.toLowerCase()) || i.invoice_number.includes(search))
  );

  const statusBadge = (s: string) => {
    const map: any = { paid: "bg-emerald-500", pending: "bg-amber-500", expired: "bg-slate-500", failed: "bg-red-500" };
    return <Badge className={map[s] || "bg-slate-500"}>{s.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Transaksi Pembayaran</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari siswa / nomor invoice" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem><SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Deskripsi</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead><TableHead>Net</TableHead><TableHead>Method</TableHead>
                  <TableHead>Status</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>}
                  {filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs font-mono">{i.invoice_number}</TableCell>
                      <TableCell className="text-xs">{i.description}</TableCell>
                      <TableCell className="font-semibold">{fmtIDR(i.total_amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtIDR(i.gateway_fee)}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">{fmtIDR(i.net_amount)}</TableCell>
                      <TableCell className="text-xs">{i.payment_method || "-"}</TableCell>
                      <TableCell>{statusBadge(i.status)}</TableCell>
                      <TableCell>
                        {i.status === "pending" && (i.payment_url ?
                          <Button size="sm" variant="outline" onClick={() => window.open(i.payment_url, "_blank")}><LinkIcon className="h-3 w-3 mr-1" /> Buka</Button> :
                          <Button size="sm" className="bg-emerald-600" onClick={() => createLink(i.id)}>Buat Link</Button>
                        )}
                      </TableCell>
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

// ============ PAYMENT GATEWAY ============
export function BendaharaGateway() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>({ environment: "production", use_platform_key: true, api_key: "", secret_key: "", webhook_url: "" });
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle"|"connected"|"failed">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from("bendahara_settings").select("*").eq("school_id", profile.school_id).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data);
        if (data.last_test_status === "connected") setStatus("connected");
        else if (data.last_test_status === "failed") setStatus("failed");
      }
    });
  }, [profile?.school_id]);

  const save = async () => {
    const { error } = await supabase.from("bendahara_settings").upsert({
      school_id: profile!.school_id,
      environment: settings.environment,
      use_platform_key: settings.use_platform_key,
      api_key: settings.api_key || null,
      secret_key: settings.secret_key || null,
      webhook_url: settings.webhook_url || null,
    }, { onConflict: "school_id" });
    if (error) toast.error(error.message); else toast.success("Pengaturan disimpan");
  };

  const test = async () => {
    setTesting(true); setStatus("idle");
    const { data, error } = await supabase.functions.invoke("spp-mayar", { body: { action: "test_connection" } });
    setTesting(false);
    if (error || !data?.success) { setStatus("failed"); setStatusMsg(error?.message || "Connection Failed"); return; }
    if (data.connected) { setStatus("connected"); setStatusMsg("Mayar Connected"); toast.success("Mayar Connected"); }
    else { setStatus("failed"); setStatusMsg(data.message || "Connection Failed"); toast.error("Connection Failed"); }
  };

  const webhookUrl = `https://bohuglednqirnaearrkj.supabase.co/functions/v1/mayar-webhook`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Pengaturan Payment Gateway</h1>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><SettingsIcon className="h-4 w-4" /> Mayar Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Environment</Label>
              <Select value={settings.environment} onValueChange={v => setSettings({ ...settings, environment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="block mb-2">Pakai API Key Platform</Label>
                <div className="flex items-center gap-2"><Switch checked={settings.use_platform_key} onCheckedChange={v => setSettings({ ...settings, use_platform_key: v })} /><span className="text-sm text-muted-foreground">{settings.use_platform_key ? "Platform" : "Custom"}</span></div>
              </div>
            </div>
          </div>

          {!settings.use_platform_key && (
            <>
              <div><Label>API Key</Label><Input value={settings.api_key || ""} onChange={e => setSettings({ ...settings, api_key: e.target.value })} placeholder="mayar_xxx" /></div>
              <div><Label>Secret Key</Label><Input type="password" value={settings.secret_key || ""} onChange={e => setSettings({ ...settings, secret_key: e.target.value })} /></div>
            </>
          )}
          <div>
            <Label>Webhook URL Callback (daftarkan di Mayar)</Label>
            <Input readOnly value={webhookUrl} className="font-mono text-xs" />
          </div>

          {status !== "idle" && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status === "connected" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700" : "bg-red-50 dark:bg-red-950/30 text-red-700"}`}>
              {status === "connected" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="font-semibold">{statusMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />} Test Connection
            </Button>
            <Button onClick={save} className="bg-emerald-600">Simpan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
