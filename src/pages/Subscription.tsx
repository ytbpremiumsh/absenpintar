import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const iconMap: Record<number, any> = { 0: Zap, 1: Star, 2: Crown };

const Subscription = () => {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setPlans((data || []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));

      if (profile?.school_id) {
        const { data: sub } = await supabase
          .from("school_subscriptions")
          .select("*, subscription_plans(name)")
          .eq("school_id", profile.school_id)
          .eq("status", "active")
          .maybeSingle();
        setCurrentSub(sub);
      }
      setLoading(false);
    };
    fetch();
  }, [profile?.school_id]);

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-mayar-payment", {
        body: { plan_id: planId },
      });
      if (error) throw error;
      if (data?.payment_url) {
        window.open(data.payment_url, "_blank");
        toast.success("Redirecting ke halaman pembayaran...");
      } else {
        toast.error("Gagal mendapatkan link pembayaran");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat pembayaran");
    }
    setPurchasing(null);
  };

  const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const highlightIdx = plans.length > 1 ? 1 : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Paket Langganan</h1>
        <p className="text-muted-foreground text-sm mt-1">Pilih paket yang sesuai dengan kebutuhan sekolah Anda</p>
        {currentSub && (
          <p className="text-sm mt-2 text-success font-semibold">
            Paket aktif: {(currentSub as any).subscription_plans?.name}
            {currentSub.expires_at && ` (berlaku hingga ${new Date(currentSub.expires_at).toLocaleDateString("id-ID")})`}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, i) => {
          const highlighted = i === highlightIdx;
          const Icon = iconMap[i] || Zap;
          const isCurrentPlan = currentSub?.plan_id === plan.id;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`shadow-card border-0 relative overflow-hidden ${highlighted ? "ring-2 ring-primary" : ""}`}>
                {highlighted && <div className="gradient-primary text-primary-foreground text-xs font-semibold text-center py-1">Paling Populer</div>}
                <CardHeader className="text-center pb-2">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${highlighted ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{formatRupiah(plan.price)}</span>
                    <span className="text-muted-foreground text-sm"> / bulan</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-success shrink-0 mt-0.5" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${highlighted ? "gradient-primary hover:opacity-90 text-primary-foreground" : ""}`}
                    variant={highlighted ? "default" : "outline"}
                    disabled={isCurrentPlan || purchasing === plan.id}
                    onClick={() => handlePurchase(plan.id)}
                  >
                    {purchasing === plan.id ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Memproses...</> : isCurrentPlan ? "Paket Aktif" : "Pilih Paket"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
