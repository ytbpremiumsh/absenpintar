import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import { Crown, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const iconMap: Record<string, typeof Zap> = {
  Free: Zap,
  Basic: Star,
  School: Crown,
  Premium: Crown,
};

export function ActivePlanBadge() {
  const { planName, loading } = useSubscriptionFeatures();
  const navigate = useNavigate();

  if (loading) return null;

  const Icon = iconMap[planName] || Zap;
  const isPaid = planName !== "Free";

  return (
    <button
      onClick={() => navigate("/subscription")}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:opacity-80 ${
        isPaid
          ? "bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/30 dark:border-amber-500/30"
          : "bg-secondary text-muted-foreground border border-border"
      }`}
      title="Klik untuk melihat langganan"
    >
      <Icon className="h-3 w-3" />
      {planName}
    </button>
  );
}
