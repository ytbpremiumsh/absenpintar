import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ScanLine, Monitor, MessageSquare, FileBarChart,
  ArrowRight, CheckCircle2, School, Mail, Phone, MapPin,
} from "lucide-react";

const iconMap: Record<string, any> = {
  scan: ScanLine,
  monitor: Monitor,
  message: MessageSquare,
  chart: FileBarChart,
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("landing_content")
      .select("key, value")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((item: any) => { map[item.key] = item.value; });
        setContent(map);
        setLoading(false);
      });
  }, []);

  const get = (key: string, fallback = "") => content[key] || fallback;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  const features = [1, 2, 3, 4].map((i) => ({
    title: get(`feature_${i}_title`),
    desc: get(`feature_${i}_desc`),
    icon: iconMap[get(`feature_${i}_icon`, "scan")] || CheckCircle2,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {get("footer_logo") ? (
              <img src={get("footer_logo")} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <School className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-foreground text-sm">{get("hero_title", "Smart Pickup")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Masuk</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/register")}>Daftar</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                {get("hero_title", "Smart Pickup School")}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                {get("hero_subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate("/register")}>
                  {get("cta_text", "Mulai Sekarang")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                  Masuk
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                {["Gratis Uji Coba", "Tanpa Kartu Kredit", "Setup Instan"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              {get("hero_image") ? (
                <img src={get("hero_image")} alt="Hero" className="w-full rounded-2xl shadow-elevated" />
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <School className="h-24 w-24 text-primary/20" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Fitur Unggulan</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">Semua yang Anda butuhkan untuk mengelola sistem penjemputan siswa</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-0 shadow-card h-full hover:shadow-elevated transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Siap Mencoba?</h2>
            <p className="mt-3 text-muted-foreground">Daftarkan sekolah Anda dan mulai gunakan sistem penjemputan digital.</p>
            <Button size="lg" className="mt-8 gradient-primary text-primary-foreground" onClick={() => navigate("/register")}>
              {get("cta_text", "Mulai Sekarang")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/[0.03] border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              {get("footer_logo") ? (
                <img src={get("footer_logo")} alt="Logo" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                  <School className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div>
                <p className="font-bold text-foreground text-sm">{get("hero_title", "Smart Pickup School")}</p>
                <p className="text-xs text-muted-foreground">Sistem Penjemputan Digital</p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 text-sm text-muted-foreground">
              {get("footer_address") && (
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {get("footer_address")}</span>
              )}
              {get("footer_email") && (
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {get("footer_email")}</span>
              )}
              {get("footer_phone") && (
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {get("footer_phone")}</span>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {get("hero_title", "Smart Pickup School")}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
