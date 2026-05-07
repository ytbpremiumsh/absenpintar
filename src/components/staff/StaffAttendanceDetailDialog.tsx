import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Calendar, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  fullName: string;
  schoolId: string | undefined;
}

export default function StaffAttendanceDetailDialog({ open, onOpenChange, userId, fullName, schoolId }: Props) {
  const [month, setMonth] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"datang" | "pulang">("datang");

  useEffect(() => {
    if (!open || !userId || !schoolId) return;
    const load = async () => {
      setLoading(true);
      const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0,10);
      const end = new Date(month.getFullYear(), month.getMonth()+1, 0).toISOString().slice(0,10);
      const { data } = await supabase.from("teacher_attendance_logs" as any)
        .select("date, time, status, attendance_type")
        .eq("school_id", schoolId).eq("user_id", userId)
        .gte("date", start).lte("date", end)
        .order("date", { ascending: true });
      setLogs(data || []);
      setLoading(false);
    };
    load();
  }, [open, userId, schoolId, month]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const dayArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i+1), [daysInMonth]);

  const summary = useMemo(() => {
    let H = 0;
    for (const d of dayArray) {
      const dateStr = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const found = logs.find((l: any) => l.date === dateStr && (l.attendance_type || "datang") === tab);
      if (found) H++;
    }
    return { H, A: daysInMonth - H };
  }, [logs, dayArray, month, tab, daysInMonth]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Kehadiran — {fullName}</DialogTitle>
          <DialogDescription>Riwayat absensi Datang & Pulang per bulan.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(month); d.setMonth(d.getMonth()-1); setMonth(d); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1.5 bg-muted/50 rounded-lg flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-3.5 w-3.5" />
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(month); d.setMonth(d.getMonth()+1); setMonth(d); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="datang" className="gap-1.5"><ArrowDownToLine className="h-3.5 w-3.5" />Datang</TabsTrigger>
            <TabsTrigger value="pulang" className="gap-1.5"><ArrowUpFromLine className="h-3.5 w-3.5" />Pulang</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 p-3 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{summary.H}</p>
              <p className="text-[11px] text-emerald-700/70">Hadir ({tab})</p>
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 p-3 flex items-center gap-3">
            <XCircle className="h-7 w-7 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{summary.A}</p>
              <p className="text-[11px] text-red-700/70">Tidak Hadir</p>
            </div>
          </div>
        </div>

        <div className="mt-3 border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border text-xs">
              {dayArray.map((d) => {
                const dateStr = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const found = logs.find((l: any) => l.date === dateStr && (l.attendance_type || "datang") === tab);
                return (
                  <div key={d} className={`bg-card p-2 min-h-[52px] flex flex-col items-center justify-center ${found ? "" : "text-muted-foreground/50"}`}>
                    <p className="text-[10px] font-semibold">{d}</p>
                    {found ? (
                      <span className="mt-0.5 text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">{(found.time || "").slice(0,5)}</span>
                    ) : (
                      <span className="text-[10px]">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
