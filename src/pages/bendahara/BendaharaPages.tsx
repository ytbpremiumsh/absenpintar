import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import {
  TrendingUp, Wallet, AlertCircle, CheckCircle2, Loader2, Plus, Search, Link as LinkIcon,
  Receipt, ArrowDownToLine, Banknote, RefreshCw, FileText, MessageCircle, Mail, Copy,
  Download, Upload, ArrowLeft, User, ChevronRight, ChevronDown, Eye, GraduationCap,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { downloadSppInvoicePDF } from "@/lib/sppInvoicePDF";

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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("*").eq("school_id", profile.school_id),
      supabase.from("spp_invoices").select("student_id, status, total_amount").eq("school_id", profile.school_id),
      supabase.from("classes").select("name").eq("school_id", profile.school_id),
    ]).then(([s, i, c]) => {
      setStudents(s.data || []);
      setInvoices(i.data || []);
      setClassList((c.data || []).map((x: any) => x.name));
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
      .filter(s => filterClass === "all" || s.class === filterClass)
      .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.student_id || "").toLowerCase().includes(search.toLowerCase()))
      .map(s => ({ ...s, ...(map.get(s.id) || { paid: 0, pending: 0, tunggakan: 0 }) }));
  }, [students, invoices, search, filterClass]);

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    enriched.forEach(s => {
      const k = s.class || "Tanpa Kelas";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [enriched]);

  // Auto-expand first 2 classes
  useEffect(() => {
    if (grouped.length && expanded.size === 0) {
      setExpanded(new Set(grouped.slice(0, 2).map(([k]) => k)));
    }
  }, [grouped.length]);

  const toggle = (k: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const summary = useMemo(() => ({
    total: enriched.length,
    lunas: enriched.filter(s => s.tunggakan === 0 && s.paid > 0).length,
    nunggak: enriched.filter(s => s.tunggakan > 0).length,
    totalSisa: enriched.reduce((sum, s) => sum + s.tunggakan, 0),
  }), [enriched]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={User}
        title="Data Siswa Keuangan"
        subtitle="Ringkasan pembayaran SPP per siswa, dikelompokkan per kelas"
      />

      {/* Summary mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Siswa" value={summary.total} icon={User} gradient="from-[#5B6CF9] to-[#4c5ded]" />
        <StatCard label="Lunas" value={summary.lunas} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Menunggak" value={summary.nunggak} icon={AlertCircle} gradient="from-red-500 to-rose-600" />
        <StatCard label="Total Tunggakan" value={fmtIDR(summary.totalSisa)} icon={Banknote} gradient="from-amber-500 to-orange-600" />
      </div>

      {/* Filter Bar */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari nama / NIS" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Filter Kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classList.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Per-Class Cards */}
      {loading ? (
        <Card className="border border-border/50 shadow-sm"><CardContent className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-[#5B6CF9] mx-auto" /></CardContent></Card>
      ) : grouped.length === 0 ? (
        <Card className="border border-border/50 shadow-sm"><CardContent className="p-12 text-center text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada data siswa</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([cls, list]) => {
            const isOpen = expanded.has(cls);
            const lunas = list.filter(s => s.tunggakan === 0 && s.paid > 0).length;
            const nunggak = list.filter(s => s.tunggakan > 0).length;
            return (
              <Card key={cls} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <button onClick={() => toggle(cls)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="h-9 w-9 rounded-lg bg-[#5B6CF9] flex items-center justify-center shrink-0 shadow-sm">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-foreground">Kelas {cls}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{list.length} siswa</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px]">Lunas {lunas}</Badge>
                    <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px]">Nunggak {nunggak}</Badge>
                  </div>
                  <div className="flex sm:hidden items-center gap-1">
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] h-5 px-1.5">{lunas}</Badge>
                    <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px] h-5 px-1.5">{nunggak}</Badge>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border/50 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map(s => (
                      <Card key={s.id}
                        onClick={() => navigate(`/bendahara/transaksi/${s.id}`)}
                        className="border border-border/50 shadow-sm hover:shadow-md hover:border-[#5B6CF9]/40 transition-all cursor-pointer overflow-hidden">
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                              {s.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate hover:underline">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">NIS {s.student_id}</p>
                            </div>
                            {s.tunggakan > 0
                              ? <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px]">Nunggak</Badge>
                              : <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px]">Lunas</Badge>}
                          </div>
                          {s.parent_name && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              Wali: {s.parent_name}{s.parent_phone ? ` · ${s.parent_phone}` : ""}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Tunggakan</p>
                              <p className={`text-sm font-bold ${s.tunggakan > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                {s.tunggakan > 0 ? fmtIDR(s.tunggakan) : "Lunas"}
                              </p>
                            </div>
                            <Button size="sm" className="h-7 px-2.5 bg-[#5B6CF9] hover:bg-[#4c5ded] text-white text-xs shadow-sm">
                              <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ TARIF SPP ============
export function BendaharaTarif() {
  const { profile } = useAuth();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ school_year: academicYearOf(new Date().getMonth() + 1, new Date().getFullYear()), amount: 0, due_date_day: 10, denda: 0 });
  const currentAY = academicYearOf(new Date().getMonth() + 1, new Date().getFullYear());
  const [filterAY, setFilterAY] = useState<string>(currentAY);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ id: "" as string | "", school_year: currentAY, class_name: "", amount: 0, due_date_day: 10, denda: 0, is_active: true });
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from("spp_tariffs").select("*").eq("school_id", profile.school_id).order("class_name"),
      supabase.from("classes").select("name").eq("school_id", profile.school_id).order("name"),
    ]).then(([t, c]) => {
      setTariffs(t.data || []);
      setClasses((c.data || []).map((x: any) => x.name));
      setLoading(false);
    });
  };
  useEffect(load, [profile?.school_id]);

  const ayOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const set = new Set<string>(academicYearList(cy));
    tariffs.forEach(t => set.add(t.school_year));
    return Array.from(set).sort();
  }, [tariffs]);

  const openAdd = () => {
    setEditing(null);
    setForm({ id: "", school_year: filterAY, class_name: "", amount: 0, due_date_day: 10, denda: 0, is_active: true });
    setOpen(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ id: t.id, school_year: t.school_year, class_name: t.class_name, amount: t.amount, due_date_day: t.due_date_day, denda: t.denda, is_active: t.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.class_name || form.amount <= 0) { toast.error("Lengkapi data"); return; }
    const payload = { school_id: profile!.school_id, school_year: form.school_year, class_name: form.class_name, amount: form.amount, due_date_day: form.due_date_day, denda: form.denda, is_active: form.is_active };
    const { error } = editing
      ? await supabase.from("spp_tariffs").update(payload).eq("id", editing.id)
      : await supabase.from("spp_tariffs").upsert(payload, { onConflict: "school_id,school_year,class_name" });
    if (error) toast.error(error.message); else { toast.success(editing ? "Tarif diperbarui" : "Tarif tersimpan"); setOpen(false); load(); }
  };

  const remove = async (t: any) => {
    if (!confirm(`Hapus tarif ${t.class_name} (${t.school_year})?`)) return;
    const { error } = await supabase.from("spp_tariffs").delete().eq("id", t.id);
    if (error) toast.error(error.message); else { toast.success("Tarif dihapus"); load(); }
  };

  const toggle = async (t: any) => {
    await supabase.from("spp_tariffs").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  const bulkApply = async () => {
    if (bulkForm.amount <= 0 || classes.length === 0) { toast.error("Tidak ada kelas / nominal kosong"); return; }
    const rows = classes.map(c => ({ school_id: profile!.school_id, school_year: bulkForm.school_year, class_name: c, amount: bulkForm.amount, due_date_day: bulkForm.due_date_day, denda: bulkForm.denda, is_active: true }));
    const { error } = await supabase.from("spp_tariffs").upsert(rows, { onConflict: "school_id,school_year,class_name" });
    if (error) toast.error(error.message); else { toast.success(`${rows.length} tarif diterapkan ke semua kelas`); setBulkOpen(false); load(); }
  };

  const filtered = useMemo(() =>
    tariffs
      .filter(t => filterAY === "all" || t.school_year === filterAY)
      .filter(t => !search || t.class_name.toLowerCase().includes(search.toLowerCase())),
    [tariffs, filterAY, search]
  );

  const summary = useMemo(() => ({
    total: filtered.length,
    aktif: filtered.filter(t => t.is_active).length,
    rata: filtered.length > 0 ? Math.round(filtered.reduce((a, t) => a + t.amount, 0) / filtered.length) : 0,
    kelasBelum: classes.filter(c => !filtered.some(t => t.class_name === c)).length,
  }), [filtered, classes]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Banknote}
        title="Tarif SPP"
        subtitle="Kelola nominal SPP per tahun ajaran & kelas"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)} className="bg-white/15 hover:bg-white/25 text-white border border-white/20"><Copy className="h-4 w-4 mr-1.5" /> Set Massal</Button>
            <Button size="sm" onClick={openAdd} className="bg-white text-[#5B6CF9] hover:bg-white/90"><Plus className="h-4 w-4 mr-1.5" /> Tambah</Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#5B6CF9]/10 to-transparent"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Tarif</p><p className="text-xl font-bold mt-0.5">{summary.total}</p></div><div className="h-9 w-9 rounded-lg bg-[#5B6CF9]/15 flex items-center justify-center"><Receipt className="h-4 w-4 text-[#5B6CF9]" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Aktif</p><p className="text-xl font-bold mt-0.5 text-emerald-600">{summary.aktif}</p></div><div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Rata-rata</p><p className="text-base font-bold mt-0.5">{fmtIDR(summary.rata)}</p></div><div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-sky-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Kelas Belum</p><p className="text-xl font-bold mt-0.5 text-amber-600">{summary.kelasBelum}</p></div><div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-amber-600" /></div></div></CardContent></Card>
      </div>

      {/* Filter bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari kelas…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={filterAY} onValueChange={setFilterAY}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
              {ayOptions.map(ay => <SelectItem key={ay} value={ay}>{ay}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#5B6CF9]" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Tahun Ajaran</TableHead>
                    <TableHead className="font-semibold">Kelas</TableHead>
                    <TableHead className="font-semibold">Nominal</TableHead>
                    <TableHead className="font-semibold">Jatuh Tempo</TableHead>
                    <TableHead className="font-semibold">Denda</TableHead>
                    <TableHead className="font-semibold">Aktif</TableHead>
                    <TableHead className="font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Belum ada tarif. Klik <strong>Tambah</strong> atau <strong>Set Massal</strong>.</TableCell></TableRow>}
                  {filtered.map(t => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm"><Badge variant="outline" className="border-[#5B6CF9]/30 text-[#5B6CF9]">{t.school_year}</Badge></TableCell>
                      <TableCell><Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{t.class_name}</Badge></TableCell>
                      <TableCell className="font-bold text-[#5B6CF9]">{fmtIDR(t.amount)}</TableCell>
                      <TableCell className="text-sm">Tanggal {t.due_date_day}</TableCell>
                      <TableCell className="text-sm">{t.denda > 0 ? fmtIDR(t.denda) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggle(t)} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(t)} className="h-8 px-2"><FileText className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(t)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"><AlertCircle className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Tarif SPP" : "Tambah Tarif SPP"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tahun Ajaran</Label>
              <Select value={form.school_year} onValueChange={v => setForm({ ...form, school_year: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ayOptions.map(ay => <SelectItem key={ay} value={ay}>{ay}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelas</Label>
              <Select value={form.class_name} onValueChange={v => setForm({ ...form, class_name: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nominal SPP (Rp)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Jatuh Tempo (tgl)</Label><Input type="number" min={1} max={28} value={form.due_date_day} onChange={e => setForm({ ...form, due_date_day: parseInt(e.target.value) || 10 })} /></div>
              <div><Label>Denda (Rp)</Label><Input type="number" value={form.denda} onChange={e => setForm({ ...form, denda: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><p className="text-sm font-medium">Status Aktif</p><p className="text-xs text-muted-foreground">Hanya tarif aktif yang bisa di-generate</p></div>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
            <Button onClick={save} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded]">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Apply Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Tarif Massal</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Terapkan satu nominal yang sama ke <strong>{classes.length} kelas</strong> sekaligus.</p>
          <div className="space-y-3">
            <div>
              <Label>Tahun Ajaran</Label>
              <Select value={bulkForm.school_year} onValueChange={v => setBulkForm({ ...bulkForm, school_year: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ayOptions.map(ay => <SelectItem key={ay} value={ay}>{ay}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nominal SPP (Rp)</Label><Input type="number" value={bulkForm.amount} onChange={e => setBulkForm({ ...bulkForm, amount: parseInt(e.target.value) || 0 })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Jatuh Tempo (tgl)</Label><Input type="number" min={1} max={28} value={bulkForm.due_date_day} onChange={e => setBulkForm({ ...bulkForm, due_date_day: parseInt(e.target.value) || 10 })} /></div>
              <div><Label>Denda (Rp)</Label><Input type="number" value={bulkForm.denda} onChange={e => setBulkForm({ ...bulkForm, denda: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <Button onClick={bulkApply} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded]">Terapkan ke {classes.length} Kelas</Button>
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
  const [students, setStudents] = useState<any[]>([]);
  const [existingInvs, setExistingInvs] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [mode, setMode] = useState<"single" | "range">("single");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  // Auto-derive AY from month/year — fully synced
  const schoolYear = useMemo(() => academicYearOf(month, year), [month, year]);
  const ayMonths = useMemo(() => monthsOfAcademicYear(schoolYear), [schoolYear]);
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(ayMonths.length - 1);
  const [skipExisting, setSkipExisting] = useState(true);
  const [autoSendWa, setAutoSendWa] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; phase: string } | null>(null);

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([
      supabase.from("classes").select("name").eq("school_id", profile.school_id).order("name"),
      supabase.from("spp_tariffs").select("*").eq("school_id", profile.school_id).eq("is_active", true),
      supabase.from("students").select("id, name, student_id, class, parent_name, parent_phone").eq("school_id", profile.school_id),
      supabase.from("spp_invoices").select("student_id, period_month, period_year").eq("school_id", profile.school_id),
    ]).then(([c, t, s, inv]) => {
      const cls = (c.data || []).map((x: any) => x.name);
      setClasses(cls);
      setSelectedClasses(cls);
      setTariffs(t.data || []);
      setStudents(s.data || []);
      setExistingInvs(inv.data || []);
    });
  }, [profile?.school_id]);

  // Reset range when AY changes
  useEffect(() => { setRangeFrom(0); setRangeTo(ayMonths.length - 1); }, [schoolYear]);

  const tariffByClass = useMemo(() => {
    const map = new Map<string, any>();
    tariffs.filter(t => t.school_year === schoolYear).forEach(t => map.set(t.class_name, t));
    return map;
  }, [tariffs, schoolYear]);

  const periods = useMemo(() => {
    if (mode === "single") return [{ month, year, label: `${MONTHS[month - 1]} ${year}` }];
    return ayMonths.slice(rangeFrom, rangeTo + 1).map(p => ({ month: p.month, year: p.year, label: p.label }));
  }, [mode, month, year, rangeFrom, rangeTo, ayMonths]);

  const targetStudents = useMemo(() =>
    students.filter(s => selectedClasses.includes(s.class)),
    [students, selectedClasses]
  );

  const preview = useMemo(() => {
    const list: any[] = [];
    let skipped = 0;
    let noTariff = 0;
    for (const s of targetStudents) {
      const tariff = tariffByClass.get(s.class);
      if (!tariff) { noTariff++; continue; }
      for (const p of periods) {
        const exists = existingInvs.some(i => i.student_id === s.id && i.period_month === p.month && i.period_year === p.year);
        if (exists && skipExisting) { skipped++; continue; }
        list.push({ student: s, tariff, period: p, exists });
      }
    }
    const total = list.reduce((a, x) => a + (x.tariff.amount || 0), 0);
    return { list, skipped, noTariff, total };
  }, [targetStudents, tariffByClass, periods, existingInvs, skipExisting]);

  const toggleClass = (c: string) => {
    setSelectedClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const generate = async () => {
    if (!profile?.school_id) return;
    if (preview.list.length === 0) { toast.error("Tidak ada tagihan untuk dibuat"); return; }
    setLoading(true);
    try {
      const rows = preview.list.map(({ student, tariff, period }) => {
        const due = new Date(period.year, period.month - 1, tariff.due_date_day);
        return {
          school_id: profile.school_id,
          student_id: student.id,
          invoice_number: `SPP/${period.year}${String(period.month).padStart(2, "0")}/${student.student_id}`,
          student_name: student.name,
          class_name: student.class,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone,
          period_month: period.month, period_year: period.year, period_label: period.label,
          description: `${student.name} - ${student.class} - ${period.label}`,
          amount: tariff.amount, denda: 0, total_amount: tariff.amount,
          due_date: due.toISOString().slice(0, 10),
        };
      });
      // Filter out periods already having an active (non-expired, non-paid is fine to skip too) invoice
      const { data: existingForPeriod } = await supabase
        .from("spp_invoices")
        .select("student_id, period_month, period_year, status")
        .eq("school_id", profile.school_id)
        .in("student_id", rows.map(r => r.student_id));
      const existsKey = new Set(
        (existingForPeriod || [])
          .filter((e: any) => e.status !== "expired")
          .map((e: any) => `${e.student_id}|${e.period_year}|${e.period_month}`)
      );
      const toInsert = rows.filter(r => !existsKey.has(`${r.student_id}|${r.period_year}|${r.period_month}`));
      if (toInsert.length === 0) { toast.info("Semua tagihan untuk periode ini sudah ada"); return; }
      const { data: inserted, error } = await supabase.from("spp_invoices").insert(toInsert).select("*");
      if (error) { toast.error(error.message); return; }
      const created = inserted || [];
      toast.success(`${created.length} tagihan SPP berhasil dibuat${created.length < rows.length ? ` (${rows.length - created.length} dilewati karena sudah ada)` : ""}`);

      // === Auto generate Mayar link + kirim WA (opsional) ===
      if (autoSendWa && created.length > 0) {
        let linkOk = 0, linkFail = 0, waOk = 0, waFail = 0, waSkip = 0;
        setBulkProgress({ done: 0, total: created.length, phase: "Membuat link pembayaran..." });
        // Sequential to avoid Mayar rate limits
        for (let i = 0; i < created.length; i++) {
          const inv = created[i];
          try {
            const { data: linkRes } = await supabase.functions.invoke("spp-mayar", {
              body: { action: "create_payment_link", invoice_id: inv.id },
            });
            const paymentUrl = linkRes?.payment_url;
            if (paymentUrl) {
              linkOk++;
              const phone = inv.parent_phone;
              if (phone) {
                const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "-";
                const msg = `Yth. Bapak/Ibu *${inv.parent_name || "Wali"}*,\n\nTagihan SPP siswa *${inv.student_name}* (${inv.class_name}) periode *${inv.period_label}* sebesar *${fmtIDR(inv.total_amount)}*.\n\nSilakan bayar melalui link:\n${paymentUrl}\n\nJatuh tempo: ${due}\n\nTerima kasih.\n_Ayo Pintar (ATSkolla)_`;
                const { error: waErr } = await supabase.functions.invoke("send-whatsapp", {
                  body: { school_id: profile.school_id, phone, message: msg, message_type: "spp_invoice" },
                });
                if (waErr) waFail++; else waOk++;
              } else {
                waSkip++;
              }
            } else {
              linkFail++;
            }
          } catch { linkFail++; }
          setBulkProgress({ done: i + 1, total: created.length, phase: "Membuat link & kirim WA..." });
        }
        setBulkProgress(null);
        toast.success(`Link berhasil: ${linkOk} • WA terkirim: ${waOk}${waFail ? ` • gagal kirim: ${waFail}` : ""}${waSkip ? ` • tanpa nomor WA: ${waSkip}` : ""}${linkFail ? ` • gagal link: ${linkFail}` : ""}`);
      }

      setPreviewOpen(false);
      // refresh existing invs to reflect new state
      const { data } = await supabase.from("spp_invoices").select("student_id, period_month, period_year").eq("school_id", profile.school_id);
      setExistingInvs(data || []);
    } finally { setLoading(false); }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FileText}
        title="Generate Tagihan SPP"
        subtitle="Buat tagihan SPP per kelas, per bulan, atau satu tahun ajaran sekaligus"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#5B6CF9]/10 to-transparent"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Tahun Ajaran</p><p className="text-base font-bold mt-0.5">{schoolYear}</p></div><div className="h-9 w-9 rounded-lg bg-[#5B6CF9]/15 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-[#5B6CF9]" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Kelas Dipilih</p><p className="text-xl font-bold mt-0.5">{selectedClasses.length}<span className="text-xs text-muted-foreground font-normal">/{classes.length}</span></p></div><div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center"><User className="h-4 w-4 text-sky-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Siswa</p><p className="text-xl font-bold mt-0.5">{targetStudents.length}</p></div><div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Akan Dibuat</p><p className="text-xl font-bold mt-0.5 text-[#5B6CF9]">{preview.list.length}</p></div><div className="h-9 w-9 rounded-lg bg-[#5B6CF9]/15 flex items-center justify-center"><Receipt className="h-4 w-4 text-[#5B6CF9]" /></div></div></CardContent></Card>
      </div>

      {/* Mode picker */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mode Generate</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => setMode("single")} className={`rounded-lg border-2 p-3 text-left transition ${mode === "single" ? "border-[#5B6CF9] bg-[#5B6CF9]/5" : "border-muted hover:border-muted-foreground/30"}`}>
              <div className="flex items-center gap-2"><Receipt className={`h-4 w-4 ${mode === "single" ? "text-[#5B6CF9]" : "text-muted-foreground"}`} /><p className="font-semibold text-sm">Satu Bulan</p></div>
              <p className="text-xs text-muted-foreground mt-1">Generate untuk 1 periode tertentu</p>
            </button>
            <button onClick={() => setMode("range")} className={`rounded-lg border-2 p-3 text-left transition ${mode === "range" ? "border-[#5B6CF9] bg-[#5B6CF9]/5" : "border-muted hover:border-muted-foreground/30"}`}>
              <div className="flex items-center gap-2"><FileText className={`h-4 w-4 ${mode === "range" ? "text-[#5B6CF9]" : "text-muted-foreground"}`} /><p className="font-semibold text-sm">Rentang Bulan</p></div>
              <p className="text-xs text-muted-foreground mt-1">Generate beberapa bulan sekaligus dalam 1 TA</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Period selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Periode</Label>
            <Badge variant="outline" className="border-[#5B6CF9]/30 text-[#5B6CF9]">TA {schoolYear}</Badge>
          </div>
          {mode === "single" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Bulan</Label>
                <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tahun</Label>
                <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Mulai dari</Label>
                <Select value={String(rangeFrom)} onValueChange={v => setRangeFrom(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ayMonths.map((m, i) => <SelectItem key={i} value={String(i)} disabled={i > rangeTo}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sampai</Label>
                <Select value={String(rangeTo)} onValueChange={v => setRangeTo(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ayMonths.map((m, i) => <SelectItem key={i} value={String(i)} disabled={i < rangeFrom}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                <strong>{periods.length} bulan</strong> akan di-generate: {periods.map(p => p.label).join(" • ")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class picker */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Kelas Tujuan</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedClasses(classes)}>Pilih semua</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedClasses([])}>Kosongkan</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {classes.map(c => {
              const tariff = tariffByClass.get(c);
              const sel = selectedClasses.includes(c);
              const studentCount = students.filter(s => s.class === c).length;
              return (
                <button key={c} onClick={() => toggleClass(c)} className={`rounded-lg border-2 p-2.5 text-left transition ${sel ? "border-[#5B6CF9] bg-[#5B6CF9]/5" : "border-muted hover:border-muted-foreground/30"} ${!tariff ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{c}</p>
                    {sel && <CheckCircle2 className="h-4 w-4 text-[#5B6CF9]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{studentCount} siswa</p>
                  {tariff ? <p className="text-[11px] font-semibold text-[#5B6CF9] mt-0.5">{fmtIDR(tariff.amount)}</p> : <p className="text-[11px] text-amber-600 mt-0.5">Tarif belum diatur</p>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Lewati tagihan yang sudah ada</p>
              <p className="text-xs text-muted-foreground">Hindari duplikat untuk siswa yang sudah punya tagihan di periode yang sama</p>
            </div>
            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 bg-[#5B6CF9]/5 border-[#5B6CF9]/20">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-[#5B6CF9]" /> Otomatis kirim WA ke wali murid</p>
              <p className="text-xs text-muted-foreground">Setelah generate, sistem otomatis membuat link Mayar dan mengirim tagihan via WhatsApp</p>
            </div>
            <Switch checked={autoSendWa} onCheckedChange={setAutoSendWa} />
          </div>
          {(preview.skipped > 0 || preview.noTariff > 0) && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 text-xs space-y-1">
              {preview.skipped > 0 && <p className="text-amber-800 dark:text-amber-200"><strong>{preview.skipped}</strong> tagihan akan dilewati (sudah ada)</p>}
              {preview.noTariff > 0 && <p className="text-amber-800 dark:text-amber-200"><strong>{preview.noTariff}</strong> siswa tidak punya tarif aktif untuk TA {schoolYear}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="sticky bottom-4 z-10">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-[#5B6CF9] to-[#4c5ded] text-white">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/70">Total estimasi</p>
              <p className="text-2xl font-bold">{fmtIDR(preview.total)}</p>
              <p className="text-xs text-white/70 mt-0.5">{preview.list.length} tagihan • {periods.length} bulan • {selectedClasses.length} kelas</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPreviewOpen(true)} disabled={preview.list.length === 0} className="bg-white/15 hover:bg-white/25 text-white border border-white/20"><Eye className="h-4 w-4 mr-1.5" /> Pratinjau</Button>
              <Button onClick={generate} disabled={loading || preview.list.length === 0} className="bg-white text-[#5B6CF9] hover:bg-white/90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Pratinjau Tagihan</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 sticky top-0">
                  <TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Periode</TableHead><TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.list.slice(0, 200).map((x, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{x.student.name}</TableCell>
                    <TableCell className="text-sm"><Badge variant="secondary">{x.student.class}</Badge></TableCell>
                    <TableCell className="text-sm">{x.period.label}</TableCell>
                    <TableCell className="text-sm font-semibold text-right">{fmtIDR(x.tariff.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.list.length > 200 && <p className="text-xs text-center py-2 text-muted-foreground">+{preview.list.length - 200} baris lagi…</p>}
          </div>
          <Button onClick={generate} disabled={loading} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Konfirmasi Generate {preview.list.length} Tagihan
          </Button>
        </DialogContent>
      </Dialog>
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

  // Sinkronkan opsi bulan dengan tahun ajaran terpilih
  const ayMonths = useMemo(() => monthsOfAcademicYear(filterAY), [filterAY]);
  // Reset filter bulan jika tidak ada di AY ini
  useEffect(() => {
    if (filterMonth !== "all" && !ayMonths.find(m => String(m.month) === filterMonth)) {
      setFilterMonth("all");
    }
  }, [filterAY]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Wallet}
        title="Pembayaran SPP"
        subtitle="Per siswa, per tahun ajaran, per bulan"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/bendahara/import-export")}
            className="bg-white/15 hover:bg-white/25 text-white border-0"
          >
            <Upload className="h-4 w-4 mr-1.5" /> Import / Export
          </Button>
        }
      />

      {/* Summary mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Siswa" value={summary.total} icon={User} gradient="from-[#5B6CF9] to-[#4c5ded]" />
        <StatCard label="Sudah Lunas" value={summary.lunas} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Menunggak" value={summary.nunggak} icon={AlertCircle} gradient="from-red-500 to-rose-600" />
        <StatCard label="Total Sisa Tagihan" value={fmtIDR(summary.totalSisa)} icon={Banknote} gradient="from-amber-500 to-orange-600" />
      </div>

      {/* Filter Bar */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari nama / NIS" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAY} onValueChange={setFilterAY}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {academicYearList(currentYear).map(ay => <SelectItem key={ay} value={ay}>TA {ay}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Bulan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {ayMonths.map(m => (
                  <SelectItem key={`${m.year}-${m.month}`} value={String(m.month)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama (A-Z)</SelectItem>
                <SelectItem value="tunggakan">Tunggakan terbesar</SelectItem>
                <SelectItem value="lunas">Bulan lunas terbanyak</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={load} className="h-8"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-Class Grouping */}
      {loading ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>
      ) : enriched.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Tidak ada data sesuai filter
        </CardContent></Card>
      ) : (
        <ClassGroupedList students={enriched} filterAY={filterAY} navigate={navigate} />
      )}
    </div>
  );
}

// Per-class collapsible cards
function ClassGroupedList({ students, filterAY, navigate }: { students: any[]; filterAY: string; navigate: any }) {
  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    students.forEach(s => {
      const k = s.class || "Tanpa Kelas";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [students]);

  const [openClass, setOpenClass] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    grouped.forEach(([k], i) => { o[k] = i < 2; });
    return o;
  });

  return (
    <div className="space-y-3">
      {grouped.map(([className, list]) => {
        const lunas = list.filter(s => s.aggStatus === "paid").length;
        const nunggak = list.filter(s => s.sisa > 0).length;
        const totalSisa = list.reduce((sum, s) => sum + s.sisa, 0);
        const isOpen = openClass[className] ?? false;
        return (
          <Card key={className} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <button
              onClick={() => setOpenClass(p => ({ ...p, [className]: !p[className] }))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              <div className="h-9 w-9 rounded-lg bg-[#5B6CF9] flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">Kelas {className}</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{list.length} siswa</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">TA {filterAY}</p>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px]">Lunas {lunas}</Badge>
                <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px]">Nunggak {nunggak}</Badge>
                <Badge variant="outline" className="text-[11px] font-semibold border-border/60">{fmtIDR(totalSisa)}</Badge>
              </div>
              <div className="flex md:hidden items-center gap-1">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] h-5 px-1.5">{lunas}</Badge>
                <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px] h-5 px-1.5">{nunggak}</Badge>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-border/50">
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(s => {
                    const pct = s.total > 0 ? Math.round((s.lunas / s.total) * 100) : 0;
                    return (
                      <Card
                        key={s.id}
                        onClick={() => navigate(`/bendahara/transaksi/${s.id}?ay=${encodeURIComponent(filterAY)}`)}
                        className="border border-border/50 shadow-sm hover:shadow-md hover:border-[#5B6CF9]/40 transition-all cursor-pointer overflow-hidden"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                              {s.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate hover:underline">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">NIS {s.student_id}</p>
                            </div>
                            <StatusBadge status={s.aggStatus} />
                          </div>
                          {s.parent_name && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              Wali: {s.parent_name}{s.parent_phone ? ` · ${s.parent_phone}` : ""}
                            </p>
                          )}
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-medium text-muted-foreground">{s.lunas}/{s.total} bulan lunas</span>
                              <span className="font-semibold text-[#5B6CF9]">{pct}%</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Sisa Tagihan</p>
                              <p className={`text-sm font-bold ${s.sisa > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                {s.sisa > 0 ? fmtIDR(s.sisa) : "Lunas"}
                              </p>
                            </div>
                            <Button size="sm" className="h-7 px-2.5 bg-[#5B6CF9] hover:bg-[#4c5ded] text-white text-xs shadow-sm">
                              <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
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

  // Auto-mark as expired client-side based on expired_at
  const enrichedInvoices = useMemo(() => {
    const now = Date.now();
    return invoices.map((i) => {
      if (i.status === "pending" && i.expired_at && new Date(i.expired_at).getTime() < now) {
        return { ...i, _displayStatus: "expired" };
      }
      return { ...i, _displayStatus: i.status };
    });
  }, [invoices]);

  const enrichedGrid = useMemo(() => ayMonths.map(m => {
    const inv = enrichedInvoices.find(x => x.period_month === m.month && x.period_year === m.year && x._displayStatus !== "expired")
      || enrichedInvoices.find(x => x.period_month === m.month && x.period_year === m.year);
    return { ...m, inv };
  }), [ayMonths, enrichedInvoices]);

  const createPaymentLink = async (inv: any, regen = false) => {
    setBusy(`link-${inv.id}`);
    toast.loading(regen ? "Membuat ulang link..." : "Membuat link Mayar...");
    const action = regen ? "regenerate_payment_link" : "create_payment_link";
    const { data, error } = await supabase.functions.invoke("spp-mayar", { body: { action, invoice_id: inv.id } });
    toast.dismiss();
    setBusy(null);
    if (error || !data?.success) { toast.error(data?.error || error?.message || "Gagal"); return; }
    if (data.payment_url) { toast.success(regen ? "Link baru berhasil dibuat" : "Link berhasil dibuat"); load(); }
  };

  const copyLink = (url: string) => { navigator.clipboard.writeText(url); toast.success("Link disalin"); };

  const sendWa = async (inv: any) => {
    if (!inv.parent_phone) { toast.error("Wali murid tidak punya nomor WA"); return; }
    if (!inv.payment_url) { toast.error("Buat link pembayaran dulu"); return; }
    const msg = `Yth. Bapak/Ibu *${inv.parent_name || "Wali"}*,\n\nTagihan SPP siswa *${inv.student_name}* (${inv.class_name}) periode *${inv.period_label}* sebesar *${fmtIDR(inv.total_amount)}*.\n\nSilakan bayar melalui link:\n${inv.payment_url}\n\nJatuh tempo: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "-"}\n\nTerima kasih.\n_Ayo Pintar (ATSkolla)_`;
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
    const body = `Yth. ${inv.parent_name || "Wali"},\n\nTagihan SPP ${inv.student_name} (${inv.class_name}) periode ${inv.period_label}: ${fmtIDR(inv.total_amount)}.\n\nLink: ${inv.payment_url}\n\nTerima kasih.\nAyo Pintar`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const downloadPdf = async (inv: any) => {
    if (!profile?.school_id) return;
    setBusy(`pdf-${inv.id}`);
    try {
      const { data: school } = await supabase.from("schools").select("name, address, npsn, logo").eq("id", profile.school_id).maybeSingle();
      await downloadSppInvoicePDF({
        invoice: inv,
        student: { student_id: student?.student_id, nisn: student?.nisn, parent_name: student?.parent_name },
        school: school || { name: "Sekolah" },
        bendahara_name: profile.full_name || null,
      });
      toast.success("Invoice diunduh");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunduh invoice");
    } finally {
      setBusy(null);
    }
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
            {enrichedGrid.map(g => {
              const status = g.inv?._displayStatus || g.inv?.status || "unpaid";
              const colorMap: any = {
                paid: "border-emerald-500/40 bg-emerald-500/5",
                pending: "border-amber-500/40 bg-amber-500/5",
                unpaid: "border-slate-300 dark:border-slate-700",
                failed: "border-red-500/40 bg-red-500/5",
                expired: "border-orange-500/40 bg-orange-500/5",
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
                {enrichedInvoices.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada tagihan</TableCell></TableRow>}
                {enrichedInvoices
                  .filter((inv) => {
                    const a = academicYearOf(inv.period_month, inv.period_year);
                    return a === ay;
                  })
                  .sort((a, b) => (a.period_year - b.period_year) || (a.period_month - b.period_month) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
                  .map((inv) => {
                  const dStatus = inv._displayStatus || inv.status;
                  return (
                    <TableRow key={inv.id} className={inv.status === "expired" ? "opacity-60" : ""}>
                      <TableCell className="font-medium text-sm">{inv.period_label}</TableCell>
                      <TableCell className="text-xs font-mono">{inv.invoice_number}</TableCell>
                      <TableCell className="font-semibold">{fmtIDR(inv.total_amount)}</TableCell>
                      <TableCell className="text-xs">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell className="text-xs">{inv.payment_method || "-"}</TableCell>
                      <TableCell><StatusBadge status={dStatus} /></TableCell>
                      <TableCell className="text-right">
                        {dStatus === "pending" ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {!inv.payment_url ? (
                              <Button size="sm" className="bg-[#5B6CF9] hover:bg-[#4c5ded]" disabled={busy === `link-${inv.id}`} onClick={() => createPaymentLink(inv)}>
                                {busy === `link-${inv.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <><LinkIcon className="h-3 w-3 mr-1" /> Buat Link</>}
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => copyLink(inv.payment_url)} title="Salin"><Copy className="h-3 w-3" /></Button>
                                <Button size="sm" variant="outline" onClick={() => window.open(inv.payment_url, "_blank")} title="Buka"><LinkIcon className="h-3 w-3" /></Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy === `wa-${inv.id}`} onClick={() => sendWa(inv)}><MessageCircle className="h-3 w-3 mr-1" /> WA</Button>
                                <Button size="sm" variant="outline" onClick={() => sendEmail(inv)} title="Email"><Mail className="h-3 w-3" /></Button>
                              </>
                            )}
                          </div>
                        ) : dStatus === "expired" ? (
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={busy === `link-${inv.id}`} onClick={() => createPaymentLink(inv, true)}>
                            {busy === `link-${inv.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> Buat Ulang Link</>}
                          </Button>
                        ) : dStatus === "paid" ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            <Button size="sm" variant="outline" disabled={busy === `pdf-${inv.id}`} onClick={() => downloadPdf(inv)}>
                              {busy === `pdf-${inv.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Download className="h-3 w-3 mr-1" /> Invoice</>}
                            </Button>
                          </div>
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
  const [classes, setClasses] = useState<string[]>([]);
  const [school, setSchool] = useState<any>(null);

  // Export filters
  const currentAY = academicYearOf(new Date().getMonth() + 1, new Date().getFullYear());
  const [expClass, setExpClass] = useState<string>("all");
  const [expAY, setExpAY] = useState<string>(currentAY);
  const [expStatus, setExpStatus] = useState<string>("all");
  const [expCount, setExpCount] = useState({ total: 0, paid: 0, unpaid: 0, sum: 0 });

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([
      supabase.from("students").select("id, name, student_id, class, parent_name, parent_phone").eq("school_id", profile.school_id),
      supabase.from("classes").select("name").eq("school_id", profile.school_id).order("name"),
      supabase.from("schools").select("name, npsn, address").eq("id", profile.school_id).maybeSingle(),
    ]).then(([s, c, sc]) => {
      setStudents(s.data || []);
      setClasses((c.data || []).map((x: any) => x.name));
      setSchool(sc.data);
    });
  }, [profile?.school_id]);

  // Live preview count
  useEffect(() => {
    if (!profile?.school_id) return;
    let q = supabase.from("spp_invoices").select("*", { count: "exact" }).eq("school_id", profile.school_id);
    if (expClass !== "all") q = q.eq("class_name", expClass);
    if (expStatus !== "all") q = q.eq("status", expStatus);
    q.then(({ data }) => {
      const filtered = (data || []).filter(i => expAY === "all" || academicYearOf(i.period_month, i.period_year) === expAY);
      setExpCount({
        total: filtered.length,
        paid: filtered.filter(i => i.status === "paid").length,
        unpaid: filtered.filter(i => i.status !== "paid").length,
        sum: filtered.reduce((a, i) => a + (i.total_amount || 0), 0),
      });
    });
  }, [profile?.school_id, expClass, expAY, expStatus]);

  const downloadTemplate = () => {
    const sample = students.slice(0, 5);
    const header = ["nis", "nama_siswa", "kelas", "tahun_ajaran", "bulan", "tahun", "nominal", "tanggal_jatuh_tempo", "denda"];
    const exampleRows = sample.length > 0
      ? sample.map(s => [s.student_id, s.name, s.class, currentAY, "1", String(new Date().getFullYear() + 1), "150000", `${new Date().getFullYear() + 1}-01-10`, "0"])
      : [["12345", "Ahmad Fauzan", "VII A", "2026/2027", "1", "2027", "150000", "2027-01-10", "0"]];
    const ws = XLSX.utils.aoa_to_sheet([header, ...exampleRows]);
    ws["!cols"] = [{ wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagihan SPP");

    // Add reference sheet with classes & students
    const refData = [
      ["DAFTAR KELAS"], ...classes.map(c => [c]),
      [""], ["DAFTAR SISWA (NIS — Nama — Kelas)"],
      ...students.map(s => [s.student_id, s.name, s.class]),
    ];
    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsRef, "Referensi");

    XLSX.writeFile(wb, `template-import-spp-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Template diunduh — sheet 'Referensi' berisi daftar siswa & kelas");
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
          const denda = parseInt(r.denda) || 0;
          if (!nis) return errors.push({ row: rowNum, error: "NIS kosong" });
          if (!month || month < 1 || month > 12) return errors.push({ row: rowNum, error: "Bulan tidak valid (1-12)" });
          if (!year || year < 2020) return errors.push({ row: rowNum, error: "Tahun tidak valid" });
          if (!nominal || nominal <= 0) return errors.push({ row: rowNum, error: "Nominal harus > 0" });
          const student = students.find(s => s.student_id === nis);
          if (!student) return errors.push({ row: rowNum, error: `NIS ${nis} tidak ditemukan` });
          valid.push({ ...r, _student: student, _month: month, _year: year, _nominal: nominal, _denda: denda });
        });
        setValidRows(valid);
        setErrorRows(errors);
        if (valid.length > 0) toast.success(`${valid.length} baris valid, ${errors.length} error`);
        else toast.error(`Semua baris gagal divalidasi (${errors.length} error)`);
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
      const total = r._nominal + r._denda;
      return {
        school_id: profile!.school_id,
        student_id: r._student.id,
        invoice_number: `SPP/${r._year}${String(r._month).padStart(2, "0")}/${r._student.student_id}`,
        student_name: r._student.name,
        class_name: r._student.class,
        parent_name: r._student.parent_name || null,
        parent_phone: r._student.parent_phone || null,
        period_month: r._month, period_year: r._year, period_label: label,
        description: `${r._student.name} - ${r._student.class} - ${label}`,
        amount: r._nominal, denda: r._denda, total_amount: total,
        due_date: dueDate.toISOString().slice(0, 10),
      };
    });
    const { data: existingForImport } = await supabase
      .from("spp_invoices")
      .select("student_id, period_month, period_year, status")
      .eq("school_id", profile!.school_id)
      .in("student_id", rows.map(r => r.student_id));
    const existsKey = new Set(
      (existingForImport || [])
        .filter((e: any) => e.status !== "expired")
        .map((e: any) => `${e.student_id}|${e.period_year}|${e.period_month}`)
    );
    const toInsert = rows.filter(r => !existsKey.has(`${r.student_id}|${r.period_year}|${r.period_month}`));
    if (toInsert.length === 0) {
      setImporting(false);
      toast.info("Semua tagihan sudah ada");
      return;
    }
    const { error } = await supabase.from("spp_invoices").insert(toInsert);
    setImporting(false);
    if (error) toast.error(error.message);
    else { toast.success(`${toInsert.length} tagihan berhasil di-import${toInsert.length < rows.length ? ` (${rows.length - toInsert.length} dilewati)` : ""}`); setPreviewRows([]); setValidRows([]); setErrorRows([]); }
  };

  const exportData = async (format: "xlsx" | "csv" | "pdf") => {
    if (!profile?.school_id) return;
    const tid = toast.loading("Menyiapkan export...");
    let q = supabase.from("spp_invoices").select("*").eq("school_id", profile.school_id);
    if (expClass !== "all") q = q.eq("class_name", expClass);
    if (expStatus !== "all") q = q.eq("status", expStatus);
    const { data: invs } = await q.order("class_name").order("student_name").order("period_year").order("period_month");
    toast.dismiss(tid);
    const filtered = (invs || []).filter(i => expAY === "all" || academicYearOf(i.period_month, i.period_year) === expAY);
    if (filtered.length === 0) { toast.error("Tidak ada data untuk filter ini"); return; }

    const rows = filtered.map((i, idx) => ({
      "No": idx + 1,
      "No. Invoice": i.invoice_number,
      "NIS": students.find(s => s.id === i.student_id)?.student_id || "",
      "Nama Siswa": i.student_name,
      "Kelas": i.class_name,
      "Tahun Ajaran": academicYearOf(i.period_month, i.period_year),
      "Periode": i.period_label,
      "Nama Wali": i.parent_name || "",
      "No. WA Wali": i.parent_phone || "",
      "Nominal": i.amount,
      "Denda": i.denda,
      "Total": i.total_amount,
      "Jatuh Tempo": i.due_date ? new Date(i.due_date).toLocaleDateString("id-ID") : "",
      "Status": i.status === "paid" ? "Lunas" : i.status === "pending" ? "Pending" : i.status === "expired" ? "Kadaluarsa" : "Belum Bayar",
      "Tgl Bayar": i.paid_at ? new Date(i.paid_at).toLocaleDateString("id-ID") : "",
      "Metode": i.payment_method || "",
    }));

    const filterTag = `${expAY === "all" ? "ALL" : expAY.replace("/", "-")}_${expClass === "all" ? "SEMUA-KELAS" : expClass.replace(/\s/g, "-")}_${expStatus.toUpperCase()}`;
    const fname = `SPP_${filterTag}_${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      // Group per class — one sheet per class (national format)
      if (expClass === "all") {
        const grouped = new Map<string, any[]>();
        rows.forEach(r => {
          const cls = String(r["Kelas"]);
          if (!grouped.has(cls)) grouped.set(cls, []);
          grouped.get(cls)!.push(r);
        });
        // Summary sheet
        const summary = Array.from(grouped.entries()).map(([cls, list]) => ({
          "Kelas": cls,
          "Jumlah Tagihan": list.length,
          "Lunas": list.filter(x => x.Status === "Lunas").length,
          "Belum Bayar": list.filter(x => x.Status !== "Lunas").length,
          "Total Tagihan": list.reduce((a, x) => a + (x.Total || 0), 0),
        }));
        const wsSum = XLSX.utils.json_to_sheet(summary);
        wsSum["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, wsSum, "Ringkasan");
        // Per-class sheet
        Array.from(grouped.entries()).forEach(([cls, list]) => {
          const ws = XLSX.utils.json_to_sheet(list);
          ws["!cols"] = Object.keys(list[0]).map(k => ({ wch: Math.min(Math.max(k.length + 2, 10), 28) }));
          XLSX.utils.book_append_sheet(wb, ws, cls.slice(0, 31));
        });
      } else {
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.min(Math.max(k.length + 2, 10), 28) }));
        XLSX.utils.book_append_sheet(wb, ws, expClass.slice(0, 31));
      }
      XLSX.writeFile(wb, `${fname}.xlsx`);
    } else if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${fname}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const doc = new jsPDF("l", "mm", "a4");
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("LAPORAN TAGIHAN SPP", 14, 14);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(school?.name || "", 14, 21);
      doc.setFontSize(9);
      doc.text(`NPSN: ${school?.npsn || "-"}`, 14, 27);
      doc.text(`Tahun Ajaran: ${expAY === "all" ? "Semua" : expAY}  •  Kelas: ${expClass === "all" ? "Semua" : expClass}  •  Status: ${expStatus === "all" ? "Semua" : expStatus}`, 14, 33);
      doc.text(`Total: ${rows.length} tagihan • ${fmtIDR(rows.reduce((a, r) => a + (r.Total || 0), 0))}`, 14, 39);
      (doc as any).autoTable({
        startY: 45,
        head: [["No", "NIS", "Nama Siswa", "Kelas", "Periode", "Total", "Jatuh Tempo", "Status"]],
        body: rows.map(r => [r.No, r.NIS, r["Nama Siswa"], r.Kelas, r.Periode, fmtIDR(r.Total), r["Jatuh Tempo"], r.Status]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [91, 108, 249], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 252] },
      });
      doc.save(`${fname}.pdf`);
    }
    toast.success("Export selesai");
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={ArrowDownToLine} title="Import & Export SPP" subtitle="Format nasional — sistematis per kelas, mendukung Excel, CSV, dan PDF" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#5B6CF9]/10 to-transparent"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Tagihan</p><p className="text-xl font-bold mt-0.5">{expCount.total}</p></div><div className="h-9 w-9 rounded-lg bg-[#5B6CF9]/15 flex items-center justify-center"><Receipt className="h-4 w-4 text-[#5B6CF9]" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Lunas</p><p className="text-xl font-bold mt-0.5 text-emerald-600">{expCount.paid}</p></div><div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Belum Bayar</p><p className="text-xl font-bold mt-0.5 text-amber-600">{expCount.unpaid}</p></div><div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-amber-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Nominal</p><p className="text-base font-bold mt-0.5">{fmtIDR(expCount.sum)}</p></div><div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center"><Banknote className="h-4 w-4 text-sky-600" /></div></div></CardContent></Card>
      </div>

      {/* Export */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-[#5B6CF9]" /> Export Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Tahun Ajaran</Label>
              <Select value={expAY} onValueChange={setExpAY}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua TA</SelectItem>
                  {academicYearList(new Date().getFullYear()).map(ay => <SelectItem key={ay} value={ay}>{ay}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kelas</Label>
              <Select value={expClass} onValueChange={setExpClass}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas (per-sheet)</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={expStatus} onValueChange={setExpStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unpaid">Belum Bayar</SelectItem>
                  <SelectItem value="expired">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Format Nasional:</strong> kolom No, No. Invoice, NIS, Nama, Kelas, Tahun Ajaran, Periode, Wali, Nominal, Denda, Total, Jatuh Tempo, Status, Tgl Bayar.
            Saat memilih "Semua Kelas", Excel akan dipisah <strong>per-sheet kelas</strong> + sheet Ringkasan.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportData("xlsx")} className="bg-[#5B6CF9] hover:bg-[#4c5ded]"><Download className="h-4 w-4 mr-2" /> Excel (per kelas)</Button>
            <Button onClick={() => exportData("csv")} variant="outline"><Download className="h-4 w-4 mr-2" /> CSV</Button>
            <Button onClick={() => exportData("pdf")} variant="outline"><Download className="h-4 w-4 mr-2" /> PDF Laporan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-[#5B6CF9]" /> Import Tagihan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border-2 border-dashed border-[#5B6CF9]/30 bg-[#5B6CF9]/5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Langkah 1 — Unduh Template</p>
                <p className="text-xs text-muted-foreground">Template berisi sheet Referensi (daftar siswa & kelas Anda)</p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}><FileText className="h-4 w-4 mr-2" /> Download Template</Button>
            </div>
          </div>
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4">
            <p className="text-sm font-semibold mb-2">Langkah 2 — Upload File</p>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="max-w-sm" />
            <p className="text-[11px] text-muted-foreground mt-2">Format: <code className="bg-muted px-1 rounded">nis, nama_siswa, kelas, tahun_ajaran, bulan, tahun, nominal, tanggal_jatuh_tempo, denda</code></p>
          </div>

          {(validRows.length > 0 || errorRows.length > 0) && (
            <>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-emerald-500 hover:bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Valid: {validRows.length}</Badge>
                {errorRows.length > 0 && <Badge className="bg-red-500 hover:bg-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Error: {errorRows.length}</Badge>}
                <Badge variant="secondary">Total: {previewRows.length}</Badge>
              </div>

              {errorRows.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Baris gagal divalidasi:</p>
                  {errorRows.map((e, i) => <p key={i} className="text-[11px] text-red-700 dark:text-red-300">Baris {e.row}: {e.error}</p>)}
                </div>
              )}

              {validRows.length > 0 && (
                <div className="border rounded-lg overflow-x-auto max-h-72">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/40"><TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Kelas</TableHead><TableHead>Periode</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {validRows.slice(0, 50).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.nis}</TableCell>
                          <TableCell className="text-xs">{r._student.name}</TableCell>
                          <TableCell className="text-xs"><Badge variant="secondary">{r._student.class}</Badge></TableCell>
                          <TableCell className="text-xs">{MONTHS[r._month - 1]} {r._year}</TableCell>
                          <TableCell className="text-xs font-semibold text-right">{fmtIDR(r._nominal + r._denda)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validRows.length > 50 && <p className="text-[11px] text-center py-2 text-muted-foreground">+{validRows.length - 50} baris lagi…</p>}
                </div>
              )}

              <Button disabled={importing || validRows.length === 0} onClick={submitImport} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded]">
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

