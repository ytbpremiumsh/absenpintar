import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Package, Search, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SuperAdminAddons = () => {
  const [domainEnabled, setDomainEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [settingRes, addonsRes] = await Promise.all([
      supabase.from("platform_settings").select("value").eq("key", "addon_custom_domain_enabled").maybeSingle(),
      supabase.from("school_addons").select("*, schools(name)").eq("addon_type", "custom_domain").order("created_at", { ascending: false }),
    ]);
    setDomainEnabled(settingRes.data?.value !== "false");
    setAddons(addonsRes.data || []);
    setLoading(false);
  };

  const toggleEnabled = async (enabled: boolean) => {
    setToggling(true);
    const { error } = await supabase.from("platform_settings").upsert(
      { key: "addon_custom_domain_enabled", value: enabled ? "true" : "false" },
      { onConflict: "key" }
    );
    if (error) {
      toast.error("Gagal mengubah pengaturan");
    } else {
      setDomainEnabled(enabled);
      toast.success(enabled ? "Menu Custom Domain diaktifkan" : "Menu Custom Domain dinonaktifkan");
    }
    setToggling(false);
  };

  const updateDomainStatus = async (addonId: string, newStatus: string) => {
    const { error } = await supabase.from("school_addons").update({ domain_status: newStatus }).eq("id", addonId);
    if (error) {
      toast.error("Gagal update status");
    } else {
      toast.success(`Status domain diubah ke ${newStatus}`);
      setAddons(addons.map((a) => a.id === addonId ? { ...a, domain_status: newStatus } : a));
    }
  };

  const filtered = addons.filter((a) =>
    (a.schools?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.custom_domain || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon: Record<string, any> = {
    active: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    pending: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
    expired: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-destructive" />
          Kelola Add-on
        </h1>
        <p className="text-muted-foreground text-sm">Kelola fitur add-on untuk sekolah</p>
      </div>

      {/* Toggle Menu */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Custom Domain</h3>
                <p className="text-xs text-muted-foreground">Menu Custom Domain untuk dashboard sekolah (Rp 200.000)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={domainEnabled ? "default" : "secondary"} className="text-[10px]">
                {domainEnabled ? "Aktif" : "Nonaktif"}
              </Badge>
              <Switch checked={domainEnabled} onCheckedChange={toggleEnabled} disabled={toggling} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List of purchased addons */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">
              Sekolah dengan Custom Domain ({addons.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari sekolah / domain..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada sekolah yang membeli Custom Domain</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{a.schools?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {a.custom_domain || "Belum diatur"}
                      </p>
                      {a.expires_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Exp: {new Date(a.expires_at).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      {statusIcon[a.domain_status] || statusIcon.pending}
                      {a.domain_status}
                    </Badge>
                    {a.domain_status === "pending" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateDomainStatus(a.id, "active")}>
                        Verifikasi
                      </Button>
                    )}
                    {a.domain_status === "active" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => window.open(`https://${a.custom_domain}`, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Buka
                      </Button>
                    )}
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

export default SuperAdminAddons;
