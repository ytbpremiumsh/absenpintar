import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles, LayoutDashboard, Users, UserCheck, CalendarDays, FileBarChart, BellRing, Rocket } from "lucide-react";

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: "Selamat Datang di ATSkolla 👋",
    desc: "ATSkolla membantu mengelola absensi siswa, guru, dan staff dalam satu sistem terintegrasi.",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Utama",
    desc: "Di sini kamu bisa melihat ringkasan absensi hari ini, jumlah siswa hadir, dan aktivitas terbaru.",
    highlight: "dashboard",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Users,
    title: "Menu Absensi Siswa",
    desc: "Kelola absensi siswa harian dengan mudah. Bisa manual atau otomatis (QR / GPS jika tersedia).",
    highlight: "absensi-siswa",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: UserCheck,
    title: "Absensi Guru & Staff",
    desc: "Pantau kehadiran guru dan staff secara real-time untuk meningkatkan disiplin dan monitoring.",
    highlight: "absensi-guru",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: CalendarDays,
    title: "Jadwal Mengajar Guru",
    desc: "Guru dapat melihat jadwal mengajar per hari, termasuk mata pelajaran dan kelas yang diampu.",
    highlight: "jadwal",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: FileBarChart,
    title: "Laporan & Rekap",
    desc: "Download laporan absensi lengkap dalam format harian, mingguan, atau bulanan.",
    highlight: "laporan",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: BellRing,
    title: "Notifikasi & Reminder",
    desc: "Sistem akan mengirimkan notifikasi jika ada siswa atau guru yang belum melakukan absensi.",
    highlight: "notifikasi",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Rocket,
    title: "Siap Digunakan! 🚀",
    desc: "Sekarang kamu sudah siap menggunakan ATSkolla. Mulai kelola absensi dengan lebih mudah dan efisien.",
    color: "from-indigo-500 to-violet-600",
  },
];

const STORAGE_KEY = "atskolla_tour_completed";

interface ProductTourProps {
  forceShow?: boolean;
}

const ProductTour = ({ forceShow = false }: ProductTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setStep(0);
      return;
    }
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [dontShowAgain]);

  const finishTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const Icon = current.icon;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -100 : 100, opacity: 0 }),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Spotlight overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={closeTour}
          />

          {/* Tour modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden pointer-events-auto">
              {/* Progress bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#5B6CF9] to-blue-500 rounded-full"
                  initial={false}
                  animate={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header with close & skip */}
              <div className="flex items-center justify-between px-5 pt-4">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {step + 1} / {TOUR_STEPS.length}
                </span>
                <button
                  onClick={closeTour}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-2 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="text-center py-6"
                  >
                    <div className={`h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg mb-5`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{current.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">{current.desc}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-1.5 pb-4">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step ? "w-6 bg-[#5B6CF9]" : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 space-y-3">
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Kembali
                    </button>
                  )}
                  <button
                    onClick={isLast ? finishTour : next}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      isLast ? "bg-gradient-to-r from-[#5B6CF9] to-violet-600 shadow-lg shadow-indigo-500/25" : "bg-[#5B6CF9] shadow-md shadow-indigo-500/20"
                    }`}
                  >
                    {isLast ? (
                      <>Mulai Sekarang <Rocket className="h-4 w-4" /></>
                    ) : (
                      <>Lanjut <ChevronRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>

                {/* Don't show again + Skip */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#5B6CF9] focus:ring-[#5B6CF9]"
                    />
                    <span className="text-[11px] text-slate-400">Jangan tampilkan lagi</span>
                  </label>
                  <button onClick={closeTour} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                    Lewati Tour
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductTour;
