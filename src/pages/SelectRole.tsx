import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Check, ArrowLeft, MessageCircle } from "lucide-react";
import { getAvailableDashboards, type DashboardOption } from "@/lib/dashboards";
import atskollaLogo from "@/assets/Logo_atskolla.png";

// Override gradient: school admin = ungu (purple)
const overrideGradient = (d: DashboardOption): string => {
  if (d.key === "school_admin") return "from-violet-500 to-purple-600";
  return d.gradient;
};

export default function SelectRole() {
  const { roles, profile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const dashboards = useMemo(() => getAvailableDashboards(roles), [roles]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (dashboards.length === 0) { navigate("/dashboard", { replace: true }); return; }
    if (dashboards.length === 1) { navigate(dashboards[0].path, { replace: true }); return; }
    if (!selected) setSelected(dashboards[0].key);
  }, [loading, user, dashboards, navigate, selected]);

  const handleContinue = () => {
    const d = dashboards.find((x) => x.key === selected);
    if (!d) return;
    sessionStorage.setItem("dashboard_chosen", "1");
    navigate(d.path, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (loading || dashboards.length <= 1) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5B6CF9] via-[#6B5DF5] to-[#8B5CF6] p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-background rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Top progress bar */}
        <div className="h-1 w-full bg-muted">
          <div className="h-full w-1/3 bg-gradient-to-r from-[#5B6CF9] to-violet-600" />
        </div>

        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#5B6CF9] to-violet-600 flex items-center justify-center shadow-md">
                <img src={atskollaLogo} alt="ATSkolla" className="h-6 w-6 object-contain" />
              </div>
              <span className="font-extrabold tracking-tight text-[#5B6CF9]">ATSkolla</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" /> Keluar
            </button>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
              Halo, {profile?.full_name || "User"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Pilih dashboard yang ingin Anda buka hari ini.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {dashboards.map((d, i) => {
              const Icon = d.icon;
              const isSelected = selected === d.key;
              const grad = overrideGradient(d);
              return (
                <motion.div
                  key={d.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card
                    onClick={() => setSelected(d.key)}
                    className={`relative cursor-pointer p-5 sm:p-6 h-full border-2 transition-all duration-200 rounded-2xl overflow-hidden group ${
                      isSelected
                        ? `bg-gradient-to-br ${grad} text-white border-transparent shadow-xl -translate-y-1`
                        : "bg-card hover:border-[#5B6CF9]/40 hover:-translate-y-0.5 hover:shadow-lg"
                    }`}
                  >
                    {/* Check / radio indicator */}
                    <div
                      className={`absolute top-3 right-3 h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? "bg-white border-white text-[#5B6CF9]"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                    </div>

                    {/* Icon illustration */}
                    <div className="flex items-center justify-center h-24 sm:h-28 mb-4">
                      <div
                        className={`h-20 w-20 rounded-2xl flex items-center justify-center transition ${
                          isSelected
                            ? "bg-white/20 backdrop-blur"
                            : `bg-gradient-to-br ${grad} text-white shadow-lg group-hover:scale-105`
                        }`}
                      >
                        <Icon className="h-10 w-10" strokeWidth={1.6} />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="text-center">
                      <p className={`font-bold text-base mb-1 ${isSelected ? "text-white" : ""}`}>
                        {d.label}
                      </p>
                      <p className={`text-xs leading-relaxed ${isSelected ? "text-white/85" : "text-muted-foreground"}`}>
                        {d.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-12 w-12 rounded-full border border-border hover:bg-muted"
              aria-label="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!selected}
              className="h-14 px-12 sm:px-16 rounded-full text-base font-semibold bg-gradient-to-r from-[#5B6CF9] to-violet-600 hover:opacity-95 shadow-lg shadow-[#5B6CF9]/30"
            >
              Lanjutkan
            </Button>

            <div className="h-12 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
