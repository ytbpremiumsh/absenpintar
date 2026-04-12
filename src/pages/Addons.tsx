import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, CreditCard, Package, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Addons = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [domainEnabled, setDomainEnabled] = useState(true);
  const [idcardEnabled, setIdcardEnabled] = useState(true);
  const [domainAddon, setDomainAddon] = useState<any>(null);
  const [idcardOrders, setIdcardOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["addon_custom_domain_enabled", "addon_idcard_enabled"]);
      (data || []).forEach((d: any) => {
        if (d.key === "addon_custom_domain_enabled" && d.value === "false") setDomainEnabled(false);
        if (d.key === "addon_idcard_enabled" && d.value === "false") setIdcardEnabled(false);
      });

      if (profile?.school_id) {
        const [domRes, orderRes] = await Promise.all([
          supabase.from("school_addons").select("*").eq("school_id", profile.school_id).eq("addon_type", "custom_domain").maybeSingle(),
          supabase.from("id_card_orders").select("*").eq("school_id", profile.school_id).order("created_at", { ascending: false }).limit(5),
        ]);
        setDomainAddon(domRes.data);
        setIdcardOrders(orderRes.data || []);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [profile?.school_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const addons = [
    ...(domainEnabled ? [{
      key: "domain",
      icon: Globe,
      title: "Custom Domain",
      description: "Gunakan domain pribadi untuk dashboard sekolah Anda",
      price: "Rp 200.000",
      priceNote: "mengikuti masa aktif langganan",
      status: domainAddon?.status === "active" ? "active" : domainAddon ? "pending" : null,
      statusLabel: domainAddon?.status === "active" ? "Aktif" : domainAddon ? "Proses" : null,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
      onClick: () => navigate("/custom-domain"),
    }] : []),
    ...(idcardEnabled ? [{
      key: "idcard",
      icon: CreditCard,
      title: "ID Card Siswa",
      description: "Cetak kartu identitas siswa dengan desain profesional & QR Code",
      price: "Rp 7.000",
      priceNote: "per kartu",
      status: idcardOrders.length > 0 ? "has_orders" : null,
      statusLabel: idcardOrders.length > 0 ? `${idcardOrders.length} pesanan` : null,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-600",
      onClick: () => navigate("/order-idcard"),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Add-on
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Fitur tambahan untuk meningkatkan sistem sekolah Anda</p>
      </div>

      {addons.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Belum ada add-on yang tersedia saat ini</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addons.map((addon) => (
          <Card
            key={addon.key}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden border-2 hover:border-primary/20"
            onClick={addon.onClick}
          >
            <CardContent className="p-0">
              <div className={`h-2 bg-gradient-to-r ${addon.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl ${addon.bgColor} flex items-center justify-center`}>
                    <addon.icon className={`h-6 w-6 ${addon.textColor}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {addon.statusLabel && (
                      <Badge variant={addon.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {addon.statusLabel}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">{addon.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-extrabold ${addon.textColor}`}>{addon.price}</span>
                  <span className="text-xs text-muted-foreground">/ {addon.priceNote}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent ID Card Orders */}
      {idcardEnabled && idcardOrders.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Pesanan ID Card Terbaru
              </h3>
              <button onClick={() => navigate("/order-idcard")} className="text-xs text-primary hover:underline">
                Lihat semua →
              </button>
            </div>
            <div className="space-y-2">
              {idcardOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                  <div>
                    <span className="font-medium">{order.total_cards} kartu</span>
                    <span className="text-muted-foreground ml-2">
                      Rp {(order.total_amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <Badge
                    variant={order.progress === "completed" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {order.progress === "waiting_payment" ? "Menunggu Bayar" :
                     order.progress === "paid" ? "Dibayar" :
                     order.progress === "processing" ? "Diproses" :
                     order.progress === "printing" ? "Dicetak" :
                     order.progress === "shipping" ? "Dikirim" :
                     order.progress === "completed" ? "Selesai" : order.progress}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Addons;
