import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, Sparkles, Loader2 } from "lucide-react";
import atskollaLogo from "@/assets/Logo_atskolla.png";
import { fetchPanduanGuides, type PanduanGuide } from "@/lib/panduanFetch";

export default function Panduan() {
  const [guides, setGuides] = useState<PanduanGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPanduanGuides()
      .then(setGuides)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-[#5B6CF9] transition-colors" />
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center">
              <img src={atskollaLogo} alt="ATSkolla" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-bold text-slate-900">ATSkolla</span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-[#5B6CF9] hover:text-[#4c5ded] transition-colors">
            Masuk Aplikasi →
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B6CF9]/10 text-[#5B6CF9] text-xs font-semibold mb-4"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Dokumentasi Resmi ATSkolla
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3"
        >
          Panduan Penggunaan Lengkap
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
          Pilih peran Anda di bawah untuk mempelajari step-by-step penggunaan ATSkolla — lengkap dengan screenshot di setiap menu.
        </motion.p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#5B6CF9]" />
          </div>
        ) : guides.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Belum ada panduan tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((g, idx) => {
              const Icon = g.icon;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: idx * 0.06, duration: 0.4 }}>
                  <Link to={`/panduan/${g.id}`}
                    className="group block relative h-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      {g.cover && (
                        <img src={g.cover} alt={g.label} loading="lazy" decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-tr ${g.color} opacity-80 mix-blend-multiply`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <motion.div className="absolute top-4 left-4 h-12 w-12 rounded-2xl bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
                        whileHover={{ rotate: -8, scale: 1.1 }}>
                        <Icon className="h-6 w-6 text-slate-800" />
                      </motion.div>
                      <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold text-slate-800">
                        <BookOpen className="h-3 w-3" /> {g.steps.length} Langkah
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white drop-shadow">{g.label}</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">{g.intro}</p>
                      <ul className="space-y-1.5 mb-5">
                        {g.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <Sparkles className="h-3 w-3 text-[#5B6CF9] shrink-0" /> <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={`inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${g.color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                        Buka Panduan
                        <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-12 text-center bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] rounded-3xl p-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-2">Siap Mencoba?</h3>
          <p className="text-white/80 mb-5">Mulai gunakan ATSkolla untuk mengelola sekolah Anda secara digital.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login" className="px-6 py-3 rounded-xl bg-white text-[#5B6CF9] font-bold hover:bg-slate-100 transition-colors">Masuk Aplikasi</Link>
            <Link to="/register" className="px-6 py-3 rounded-xl border border-white/30 text-white font-bold hover:bg-white/10 transition-colors">Daftar Gratis</Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 mt-12 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ATSkolla — Platform Digital Sekolah
      </footer>
    </div>
  );
}
