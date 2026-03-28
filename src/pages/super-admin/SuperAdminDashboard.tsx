import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { School, Users, CreditCard, TrendingUp, CheckCircle2, GraduationCap, UserCheck, Clock, BarChart3, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenue: number;
  recentPayments: any[];
  schools: any[];
  monthlyRevenue: number;
  schoolUsage: { name: string; students: number; classes: number; plan: string }[];
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0, totalStudents: 0, totalStaff: 0, totalClasses: 0,
    activeSubscriptions: 0, pendingPayments: 0,
    totalRevenue: 0, monthlyRevenue: 0,
    recentPayments: [], schools: [], schoolUsage: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [schoolsRes, studentsRes, classesRes, profilesRes, subsRes, paymentsRes, rolesRes] = await Promise.all([
        supabase.from("schools").select("id, name, created_at, logo, address"),
        supabase.from("students").select("id, school_id"),
        supabase.from("classes").select("id, school_id"),
        supabase.from("profiles").select("id, school_id"),
        supabase.from("school_subscriptions").select("id, school_id, plan_id, status, started_at, expires_at, subscription_plans(name)"),
        supabase.from("payment_transactions").select("id, school_id, amount, status, paid_at, created_at, schools(name), subscription_plans(name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("user_roles").select("id, role"),
      ]);

      const schools = schoolsRes.data || [];
      const students = studentsRes.data || [];
      const classes = classesRes.data || [];
      const subs = subsRes.data || [];
      const payments = paymentsRes.data || [];
      const roles = rolesRes.data || [];

      const activeSubs = subs.filter((s: any) => s.status === "active");
      const pendingPayments = payments.filter((p: any) => p.status === "pending");
      const paidPayments = payments.filter((p: any) => p.status === "paid");
      const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyRevenue = paidPayments
        .filter((p: any) => p.paid_at && p.paid_at >= startOfMonth)
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const staffCount = roles.filter((r: any) => r.role !== "super_admin").length;

      const schoolUsage = schools.map((s: any) => {
        const schoolStudents = students.filter((st: any) => st.school_id === s.id).length;
        const schoolClasses = classes.filter((c: any) => c.school_id === s.id).length;
        const sub = activeSubs.find((sub: any) => sub.school_id === s.id);
        const planName = sub ? (sub as any).subscription_plans?.name || "Free" : "Free";
        return { name: s.name, students: schoolStudents, classes: schoolClasses, plan: planName };
      });

      setStats({
        totalSchools: schools.length,
        totalStudents: students.length,
        totalStaff: staffCount,
        totalClasses: classes.length,
        activeSubscriptions: activeSubs.length,
        pendingPayments: pendingPayments.length,
        totalRevenue,
        monthlyRevenue,
        recentPayments: payments,
        schools,
        schoolUsage,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const statCards = [
    { icon: School, label: "Total Sekolah", value: stats.totalSchools, gradient: "from-indigo-500 to-blue-600", textColor: "text-indigo-600 dark:text-indigo-400" },
    { icon: GraduationCap, label: "Total Siswa", value: stats.totalStudents.toLocaleString("id-ID"), gradient: "from-blue-500 to-cyan-500", textColor: "text-blue-600 dark:text-blue-400" },
    { icon: Activity, label: "Total Kelas", value: stats.totalClasses, gradient: "from-violet-500 to-purple-600", textColor: "text-violet-600 dark:text-violet-400" },
    { icon: UserCheck, label: "Total Pengguna", value: stats.totalStaff, gradient: "from-teal-500 to-emerald-500", textColor: "text-teal-600 dark:text-teal-400" },
    { icon: CheckCircle2, label: "Langganan Aktif", value: stats.activeSubscriptions, gradient: "from-emerald-500 to-green-600", textColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Clock, label: "Pembayaran Pending", value: stats.pendingPayments, gradient: "from-amber-500 to-orange-500", textColor: "text-amber-600 dark:text-amber-400" },
    { icon: CreditCard, label: "Total Pendapatan", value: formatRupiah(stats.totalRevenue), gradient: "from-green-500 to-emerald-600", textColor: "text-green-600 dark:text-green-400" },
    { icon: BarChart3, label: "Pendapatan Bulan Ini", value: formatRupiah(stats.monthlyRevenue), gradient: "from-rose-500 to-pink-600", textColor: "text-rose-600 dark:text-rose-400" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 p-5 sm:p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-white/60 text-sm mt-1">Overview platform & monitoring sekolah</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="card-premium">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-extrabold ${s.textColor} truncate`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* School Usage Statistics */}
      <Card className="card-premium">
        <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent rounded-t-2xl">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            Statistik Penggunaan per Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.schoolUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada sekolah terdaftar</p>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-sm font-bold text-foreground">Total Keseluruhan</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-primary">{stats.schoolUsage.length}</p>
                    <p className="text-[11px] text-muted-foreground">Sekolah</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-primary">{stats.schoolUsage.reduce((sum, s) => sum + s.classes, 0)}</p>
                    <p className="text-[11px] text-muted-foreground">Kelas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-primary">{stats.schoolUsage.reduce((sum, s) => sum + s.students, 0).toLocaleString("id-ID")}</p>
                    <p className="text-[11px] text-muted-foreground">Siswa</p>
                  </div>
                </div>
              </div>
              {stats.schoolUsage.map((s) => (
                <div key={s.name} className="p-4 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                        <School className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">Paket {s.plan}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] rounded-lg">{s.plan}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Kelas</span>
                        <span className="text-xs font-bold text-foreground">{s.classes}</span>
                      </div>
                      <Progress value={Math.min(100, s.classes * 10)} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Siswa</span>
                        <span className="text-xs font-bold text-foreground">{s.students}</span>
                      </div>
                      <Progress value={Math.min(100, s.students)} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="card-premium">
        <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent rounded-t-2xl">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <CreditCard className="h-3.5 w-3.5 text-white" />
            </div>
            Transaksi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {stats.recentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{(p as any).schools?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{(p as any).subscription_plans?.name} • {new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatRupiah(p.amount)}</p>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"} className={`text-[10px] rounded-lg ${p.status === "paid" ? "bg-success/10 text-success border-success/20" : p.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : ""}`}>
                      {p.status === "paid" ? "Lunas" : p.status === "pending" ? "Pending" : p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
