import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Wallet, Trash2, Loader2, Mail, Lock, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BendaharaUser { user_id: string; full_name: string; }

export default function ManageBendahara() {
  const { profile } = useAuth();
  const [list, setList] = useState<BendaharaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });

  const load = async () => {
    if (!profile?.school_id) { setLoading(false); return; }
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").eq("school_id", profile.school_id);
    if (!profiles) { setList([]); setLoading(false); return; }
    const ids = profiles.map(p => p.user_id);
    const { data: roles } = await supabase.from("user_roles").select("user_id").in("user_id", ids).eq("role", "bendahara" as any);
    const set = new Set((roles || []).map((r: any) => r.user_id));
    setList(profiles.filter(p => set.has(p.user_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [profile?.school_id]);

  const create = async () => {
    if (!form.full_name || !form.email || !form.password) { toast.error("Lengkapi data"); return; }
    if (form.password.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setCreating(true);
    const res = await supabase.functions.invoke("create-user", {
      body: { ...form, role: "bendahara", school_id: profile!.school_id },
    });
    setCreating(false);
    if (res.error || res.data?.error) { toast.error(res.data?.error || res.error?.message); return; }
    toast.success(`Bendahara ${form.full_name} dibuat`);
    setOpen(false); setForm({ full_name: "", email: "", password: "", phone: "" }); load();
  };

  const remove = async (u: BendaharaUser) => {
    if (!confirm(`Cabut role Bendahara dari ${u.full_name}?`)) return;
    await supabase.from("user_roles").delete().eq("user_id", u.user_id).eq("role", "bendahara" as any);
    toast.success("Role dicabut"); load();
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Kelola Bendahara" subtitle="Tambah dan kelola akun Bendahara untuk fitur keuangan" actions={
        <Button onClick={() => setOpen(true)} className="bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-xl text-xs">
          <Plus className="h-4 w-4 mr-2" /> Tambah Bendahara
        </Button>
      } />
      {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : list.length === 0 ? (
        <Card className="border-0 shadow-card"><CardContent className="p-10 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Belum ada Bendahara</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(u => (
            <Card key={u.user_id} className="border-0 shadow-card"><CardContent className="p-5 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold">{u.full_name[0]}</div>
              <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{u.full_name}</p>
                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 mt-1"><Wallet className="h-3 w-3 mr-1" /> Bendahara</Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(u)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Tambah Bendahara</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Lengkap</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><div className="relative"><Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-9" /></div></div>
            <div><Label>Password</Label><div className="relative"><Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-9" /></div></div>
            <div><Label>WhatsApp</Label><div className="relative"><Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="pl-9" /></div></div>
            <Button onClick={create} disabled={creating} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Buat Akun
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
