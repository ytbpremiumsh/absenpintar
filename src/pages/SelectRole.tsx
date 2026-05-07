import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowRight } from "lucide-react";
import { getAvailableDashboards } from "@/lib/dashboards";
import atskollaLogo from "@/assets/Logo_atskolla.png";

export default function SelectRole() {
  const { roles, profile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const dashboards = useMemo(() => getAvailableDashboards(roles), [roles]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (dashboards.length === 0) { navigate("/dashboard", { replace: true }); return; }
    if (dashboards.length === 1) { navigate(dashboards[0].path, { replace: true }); return; }
  }, [loading, user, dashboards, navigate]);

  const choose = (path: string) => {
    sessionStorage.setItem("dashboard_chosen", "1");
    navigate(path, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (loading || dashboards.length <= 1) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center shadow-lg">
              <img src={atskollaLogo} alt="ATSkolla" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">ATSkolla</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Halo, {profile?.full_name || "User"}</h1>
          <p className="text-muted-foreground text-sm">
            Anda memiliki beberapa peran. Pilih dashboard yang ingin Anda buka.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {dashboards.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card
                  onClick={() => choose(d.path)}
                  className="group cursor-pointer border-0 shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5"
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${d.gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <Icon className="h-7 w-7 shrink-0" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
