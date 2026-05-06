import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, BookOpen } from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";
import { GUIDES, type RoleGuide } from "@/data/panduanGuides";

export default function PanduanDetail() {
  const { role } = useParams<{ role: string }>();
  const guide = GUIDES.find((g) => g.id === role) as RoleGuide | undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [role]);

  if (!guide) return <Navigate to="/panduan" replace />;
  const Icon = guide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/panduan" className="flex items-center gap-2.5 group">
            <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-[#5B6CF9] transition-colors" />
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center">
              <img src={atskollaLogo} alt="ATSkolla" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-bold text-slate-900 hidden sm:inline">ATSkolla</span>
            <span className="text-sm text-slate-400 hidden sm:inline">/ Panduan</span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-semibold text-[#5B6CF9] hover:text-[#4c5ded] transition-colors"
          >
            Masuk →
          </Link>
        </div>
      </header>

      {/* Hero per role */}
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${guide.color} opacity-10`} />
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div
              className={`h-16 w-16 rounded-3xl bg-gradient-to-br ${guide.color} flex items-center justify-center shadow-xl shrink-0`}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 mb-2">
                <BookOpen className="h-3 w-3" />
                {guide.steps.length} langkah panduan
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                Panduan {guide.label}
              </h1>
              <p className="text-slate-600 leading-relaxed">{guide.intro}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {guide.steps.map((step, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 md:p-7 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>

              {step.bullets && (
                <ul className="space-y-2 mb-4">
                  {step.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <ChevronRight className="h-4 w-4 mt-0.5 text-[#5B6CF9] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.tips && step.tips.length > 0 && (
                <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Tips
                  </div>
                  <ul className="space-y-1.5">
                    {step.tips.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-amber-900"
                      >
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.image && (
                <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </motion.article>
          ))}
        </div>

        {/* Other roles */}
        <div className="mt-12">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
            Panduan Lainnya
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GUIDES.filter((g) => g.id !== guide.id).map((g) => {
              const GIcon = g.icon;
              return (
                <Link
                  key={g.id}
                  to={`/panduan/${g.id}`}
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#5B6CF9] hover:shadow-md transition-all"
                >
                  <div
                    className={`h-9 w-9 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center shrink-0`}
                  >
                    <GIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {g.shortLabel}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {g.steps.length} langkah
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] rounded-3xl p-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-2">Siap Mencoba?</h3>
          <p className="text-white/80 mb-5">
            Mulai gunakan ATSkolla untuk mengelola absensi & SPP sekolah Anda.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white text-[#5B6CF9] font-bold hover:bg-slate-100 transition-colors"
            >
              Masuk Aplikasi
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl border border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 mt-12 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ATSkolla — Platform Digital Sekolah
      </footer>
    </div>
  );
}
