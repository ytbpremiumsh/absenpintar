import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, Users, Search, Pencil, Eye, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  logo: string | null;
  created_at: string;
  studentCount?: number;
  subscription?: { id: string; plan_id: string; plan_name: string; status: string; expires_at: string | null } | null;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
}

const SuperAdminSchools = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editSchool, setEditSchool] = useState<SchoolData | null>(null);
  const [detailSchool, setDetailSchool] = useState<SchoolData | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });

  // Subscription edit state
  const [subSchool, setSubSchool] = useState<SchoolData | null>(null);
  const [subForm, setSubForm] = useState({ plan_id: "", status: "active", expires_at: "" });
  const [subSaving, setSubSaving] = useState(false);

  const fetchSchools = async () => {
    const [schoolsRes, studentsRes, subsRes, plansRes] = await Promise.all([
      supabase.from("schools").select("*"),
      supabase.from("students").select("school_id"),
      supabase.from("school_subscriptions").select("id, school_id, plan_id, status, expires_at, subscription_plans(name)"),
      supabase.from("subscription_plans").select("id, name, price").eq("is_active", true).order("sort_order"),
    ]);

    const schoolsList = schoolsRes.data || [];
    const students = studentsRes.data || [];
    const subs = subsRes.data || [];
    setPlans(plansRes.data || []);

    const mapped: SchoolData[] = schoolsList.map((s: any) => {
      const count = students.filter((st: any) => st.school_id === s.id).length;
      // Get the most relevant subscription (active first, then latest)
      const schoolSubs = subs.filter((sb: any) => sb.school_id === s.id);
      const activeSub = schoolSubs.find((sb: any) => sb.status === "active") || schoolSubs[0];
      return {
        ...s,
        studentCount: count,
        subscription: activeSub
          ? { id: activeSub.id, plan_id: activeSub.plan_id, plan_name: (activeSub as any).subscription_plans?.name || "—", status: activeSub.status, expires_at: activeSub.expires_at }
          : null,
      };
    });
    setSchools(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchSchools(); }, []);

  const filtered = schools.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleEditSave = async () => {
    if (!editSchool) return;
    const { error } = await supabase.from("schools").update({ name: editForm.name, address: editForm.address || null }).eq("id", editSchool.id);
    if (error) { toast.error("Gagal update: " + error.message); return; }
    toast.success("Sekolah berhasil diupdate");
    setEditSchool(null);
    fetchSchools();
  };

  const openSubDialog = (s: SchoolData) => {
    setSubSchool(s);
    setSubForm({
      plan_id: s.subscription?.plan_id || (plans[0]?.id || ""),
      status: s.subscription?.status || "active",
      expires_at: s.subscription?.expires_at ? s.subscription.expires_at.slice(0, 10) : "",
    });
  };

  const handleSubSave = async () => {
    if (!subSchool || !subForm.plan_id) return;
    setSubSaving(true);

    const payload = {
      school_id: subSchool.id,
      plan_id: subForm.plan_id,
      status: subForm.status,
      expires_at: subForm.expires_at ? new Date(subForm.expires_at).toISOString() : null,
    };

    if (subSchool.subscription?.id) {
      // Update existing
      const { error } = await supabase.from("school_subscriptions").update(payload).eq("id", subSchool.subscription.id);
      if (error) { toast.error("Gagal update: " + error.message); setSubSaving(false); return; }
      toast.success("Langganan berhasil diupdate");
    } else {
      // Insert new
      const { error } = await supabase.from("school_subscriptions").insert(payload);
      if (error) { toast.error("Gagal buat langganan: " + error.message); setSubSaving(false); return; }
      toast.success("Langganan berhasil ditambahkan");
    }

    setSubSaving(false);
    setSubSchool(null);
    fetchSchools();
  };

  const statusOptions = [
    { value: "active", label: "Aktif", color: "bg-success/10 text-success" },
    { value: "expired", label: "Kedaluwarsa", color: "bg-warning/10 text-warning" },
    { value: "cancelled", label: "Dibatalkan", color: "bg-destructive/10 text-destructive" },
    { value: "pending", label: "Menunggu", color: "bg-muted text-muted-foreground" },
  ];

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find((o) => o.value === status);
    return <Badge className={`${opt?.color || "bg-muted text-muted-foreground"} text-[10px] border-0`}>{opt?.label || status}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Sekolah</h1>
          <p className="text-muted-foreground text-sm">{schools.length} sekolah terdaftar</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <School className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{s.name}</h3>
                    {s.address && <p className="text-xs text-muted-foreground truncate">{s.address}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]"><Users className="h-3 w-3 mr-0.5" />{s.studentCount} siswa</Badge>
                      {s.subscription ? (
                        <>
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{s.subscription.plan_name}</Badge>
                          {getStatusBadge(s.subscription.status)}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Belum berlangganan</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Detail" onClick={() => setDetailSchool(s)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ubah Langganan" onClick={() => openSubDialog(s)}><CreditCard className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => { setEditSchool(s); setEditForm({ name: s.name, address: s.address || "" }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editSchool} onOpenChange={() => setEditSchool(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Sekolah</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Sekolah</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Alamat</Label><Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditSave} className="gradient-primary text-primary-foreground">Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={!!subSchool} onOpenChange={() => setSubSchool(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Langganan — {subSchool?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paket Langganan</Label>
              <Select value={subForm.plan_id} onValueChange={(v) => setSubForm({ ...subForm, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih paket" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — Rp {p.price.toLocaleString("id-ID")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={subForm.status} onValueChange={(v) => setSubForm({ ...subForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Berlaku Sampai (opsional)</Label>
              <Input type="date" value={subForm.expires_at} onChange={(e) => setSubForm({ ...subForm, expires_at: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk unlimited</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubSchool(null)}>Batal</Button>
            <Button onClick={handleSubSave} disabled={subSaving} className="gradient-primary text-primary-foreground">
              {subSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailSchool} onOpenChange={() => setDetailSchool(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detailSchool?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><p className="text-xs text-muted-foreground">Alamat</p><p className="text-sm text-foreground">{detailSchool?.address || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Jumlah Siswa</p><p className="text-sm font-semibold text-foreground">{detailSchool?.studentCount}</p></div>
            <div>
              <p className="text-xs text-muted-foreground">Langganan</p>
              {detailSchool?.subscription ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-success/10 text-success border-success/20">{detailSchool.subscription.plan_name}</Badge>
                  {getStatusBadge(detailSchool.subscription.status)}
                  {detailSchool.subscription.expires_at && (
                    <span className="text-xs text-muted-foreground">s/d {new Date(detailSchool.subscription.expires_at).toLocaleDateString("id-ID")}</span>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground">Belum berlangganan</p>}
            </div>
            <div><p className="text-xs text-muted-foreground">Terdaftar</p><p className="text-sm text-foreground">{detailSchool ? new Date(detailSchool.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}</p></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminSchools;
