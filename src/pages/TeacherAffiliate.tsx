import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wallet, Copy, Share2, TrendingUp, Users, BadgeDollarSign, ArrowUpRight,
  Clock, CheckCircle2, Loader2, Sparkles, Banknote, Smartphone, Gift,
  Calendar, AlertCircle, Hourglass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherAffiliate } from "@/hooks/useTeacherAffiliate";
import { getEstimatedPayoutDate } from "@/lib/holidays";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const BANKS = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "CIMB Niaga", "Permata", "Danamon", "BTN", "Lainnya"];
const EWALLETS = ["DANA", "OVO", "GoPay", "ShopeePay", "LinkAja"];

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  processing: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Review",
  approved: "Disetujui",
  processing: "Diproses",
  paid: "Sudah Cair",
  rejected: "Ditolak",
};

const PROGRESS_STEPS = [
  { key: "pending", label: "Diajukan", icon: Clock },
  { key: "approved", label: "Disetujui", icon: CheckCircle2 },
  { key: "processing", label: "Transfer", icon: Hourglass },
  { key: "paid", label: "Cair", icon: Wallet },
];

const TeacherAffiliate = () => {
  const { affiliate, commissions, withdrawals, loading, referralLink, refresh } = useTeacherAffiliate();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<"bank" | "ewallet">("bank");
  const [bankName, setBankName] = useState("");
  const [ewalletType, setEwalletType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [amount, setAmount] = useState("");

  const MIN_WD = 100000;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link affiliate disalin!");
  };

  const handleShareWA = () => {
    const text = `🎓 ATSkolla — Sistem Absensi Digital Sekolah modern. Daftarkan sekolahmu via link ini & dapatkan free trial:\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const submitWithdrawal = async () => {
    if (!affiliate) return;
    const amt = parseInt(amount.replace(/\D/g, ""), 10);
    if (isNaN(amt) || amt < MIN_WD) {
      toast.error(`Minimum pencairan ${formatRp(MIN_WD)}`);
      return;
    }
    if (amt > affiliate.current_balance) {
      toast.error("Saldo tidak mencukupi");
      return;
    }
    if (method === "bank" && !bankName) {
      toast.error("Pilih bank tujuan");
      return;
    }
    if (method === "ewallet" && !ewalletType) {
      toast.error("Pilih e-wallet tujuan");
      return;
    }
    if (!accountNumber.trim() || !accountHolder.trim()) {
      toast.error("Lengkapi nomor rekening dan nama pemilik");
      return;
    }

    // Check pending
    const hasPending = withdrawals.some((w) => w.status === "pending" || w.status === "approved" || w.status === "processing");
    if (hasPending) {
      toast.error("Masih ada pencairan dalam proses. Tunggu hingga selesai.");
      return;
    }

    setSubmitting(true);
    try {
      const estimatedAt = getEstimatedPayoutDate(new Date());
      const { error: insertErr } = await supabase.from("affiliate_withdrawals").insert({
        affiliate_id: affiliate.id,
        amount: amt,
        bank_name: method === "bank" ? bankName : "E-Wallet",
        ewallet_type: method === "ewallet" ? ewalletType : null,
        account_number: accountNumber.trim(),
        account_holder: accountHolder.trim(),
        estimated_payout_at: estimatedAt.toISOString(),
        status: "pending",
      });
      if (insertErr) throw insertErr;

      // Deduct balance
      await supabase
        .from("affiliates")
        .update({ current_balance: affiliate.current_balance - amt })
        .eq("id", affiliate.id);

      toast.success("Pencairan diajukan! Estimasi cair: " + estimatedAt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }));
      setWithdrawOpen(false);
      setAmount(""); setAccountNumber(""); setAccountHolder(""); setBankName(""); setEwalletType("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Gagal mengajukan pencairan");
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = PROGRESS_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Gift} title="Affiliate & Komisi" subtitle="Mendaftarkan akun affiliate Anda..." />
        <Card><CardContent className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gift}
        title="Program Affiliate Guru"
        subtitle="Ajak sekolah lain berlangganan & dapatkan komisi tunai 50% dari pembayaran pertama mereka"
      />

      {/* Hero — Balance card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-elevated overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[#4c5ded]" />
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <CardContent className="p-6 relative z-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Saldo Komisi Tersedia
                </p>
                <p className="text-4xl md:text-5xl font-bold mt-2 tracking-tight">{formatRp(affiliate.current_balance)}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs opacity-90">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Total Earned: <b>{formatRp(affiliate.total_earned)}</b></span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sudah Cair: <b>{formatRp(affiliate.total_withdrawn)}</b></span>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setWithdrawOpen(true)}
                disabled={affiliate.current_balance < MIN_WD}
                className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg gap-2 h-12 px-6"
              >
                <Banknote className="h-5 w-5" />
                Cairkan Komisi
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Komisi Disetujui", value: commissions.filter(c => c.status === "approved" || c.status === "paid").length, icon: BadgeDollarSign, color: "text-emerald-600", bg: "from-emerald-500/10 to-emerald-500/5" },
          { label: "Pending Review", value: commissions.filter(c => c.status === "pending").length, icon: Clock, color: "text-amber-600", bg: "from-amber-500/10 to-amber-500/5" },
          { label: "Total Pencairan", value: withdrawals.length, icon: Wallet, color: "text-violet-600", bg: "from-violet-500/10 to-violet-500/5" },
          { label: "Komisi Rate", value: `${affiliate.commission_rate}%`, icon: TrendingUp, color: "text-primary", bg: "from-primary/10 to-primary/5" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-card overflow-hidden">
              <CardContent className={cn("p-4 bg-gradient-to-br", s.bg)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-background/60", s.color)}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral link */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Link Affiliate Anda
          </CardTitle>
          <CardDescription className="text-xs">Bagikan link ini. Komisi akan masuk saat sekolah berlangganan paket berbayar pertama kalinya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 p-2.5 bg-background rounded-lg border text-xs font-mono truncate">{referralLink}</div>
            <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleShareWA} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Share2 className="h-4 w-4" /> Bagikan via WhatsApp
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-background/60 border">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Kode Affiliate</p>
            <p className="text-lg font-bold font-mono tracking-widest text-primary">{affiliate.affiliate_code}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Komisi & Pencairan */}
      <Tabs defaultValue="withdrawals">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="withdrawals">Riwayat Pencairan</TabsTrigger>
          <TabsTrigger value="commissions">Riwayat Komisi</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-3">
          {withdrawals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada pencairan</p>
            </CardContent></Card>
          ) : withdrawals.map((wd, i) => {
            const stepIdx = getStepIndex(wd.status);
            const isRejected = wd.status === "rejected";
            return (
              <motion.div key={wd.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border shadow-card">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{formatRp(wd.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {wd.ewallet_type ? `${wd.ewallet_type} · ${wd.account_number}` : `${wd.bank_name} · ${wd.account_number}`} · a/n {wd.account_holder}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[wd.status])}>
                        {STATUS_LABELS[wd.status] || wd.status}
                      </Badge>
                    </div>

                    {/* Progress Steps */}
                    {!isRejected && (
                      <div className="relative">
                        <div className="flex justify-between relative z-10">
                          {PROGRESS_STEPS.map((step, idx) => {
                            const reached = idx <= stepIdx;
                            const isCurrent = idx === stepIdx && wd.status !== "paid";
                            return (
                              <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                                <div className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all bg-background",
                                  reached ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground/40",
                                  isCurrent && "ring-4 ring-primary/20 animate-pulse",
                                )}>
                                  <step.icon className="h-4 w-4" />
                                </div>
                                <span className={cn("text-[10px] font-medium text-center", reached ? "text-foreground" : "text-muted-foreground/50")}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute top-[18px] left-[12%] right-[12%] h-0.5 bg-border -z-0">
                          <div className="h-full bg-primary transition-all" style={{ width: `${(stepIdx / (PROGRESS_STEPS.length - 1)) * 100}%` }} />
                        </div>
                      </div>
                    )}

                    {wd.estimated_payout_at && wd.status !== "paid" && !isRejected && (
                      <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Estimasi cair: <b>{new Date(wd.estimated_payout_at).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</b> (maks 3 hari kerja, di luar weekend & tanggal merah)</span>
                      </div>
                    )}

                    {isRejected && wd.admin_notes && (
                      <div className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{wd.admin_notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                      <span>Diajukan: {new Date(wd.created_at).toLocaleString("id-ID")}</span>
                      {wd.processed_at && <span>Diproses: {new Date(wd.processed_at).toLocaleString("id-ID")}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardContent className="p-0">
              {commissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BadgeDollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Belum ada komisi</p>
                  <p className="text-xs mt-1">Komisi muncul saat sekolah yang Anda undang berlangganan paket berbayar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paket</TableHead>
                      <TableHead className="text-right">Harga Paket</TableHead>
                      <TableHead className="text-right">Komisi (50%)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.plan_name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatRp(c.plan_price)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatRp(c.commission_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[c.status])}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Cairkan Komisi
            </DialogTitle>
            <DialogDescription>
              Saldo tersedia: <b className="text-foreground">{formatRp(affiliate.current_balance)}</b> · Min. {formatRp(MIN_WD)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Jumlah Pencairan</Label>
              <Input
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="text-lg font-bold"
              />
              {amount && <p className="text-xs text-muted-foreground">{formatRp(parseInt(amount, 10))}</p>}
            </div>

            <div className="space-y-2">
              <Label>Metode</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-2 gap-2">
                <Label className={cn("flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", method === "bank" && "border-primary bg-primary/5")}>
                  <RadioGroupItem value="bank" />
                  <Banknote className="h-4 w-4" /> Bank
                </Label>
                <Label className={cn("flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", method === "ewallet" && "border-primary bg-primary/5")}>
                  <RadioGroupItem value="ewallet" />
                  <Smartphone className="h-4 w-4" /> E-Wallet
                </Label>
              </RadioGroup>
            </div>

            {method === "bank" ? (
              <div className="space-y-2">
                <Label>Bank Tujuan</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger><SelectValue placeholder="Pilih bank" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>E-Wallet Tujuan</Label>
                <Select value={ewalletType} onValueChange={setEwalletType}>
                  <SelectTrigger><SelectValue placeholder="Pilih e-wallet" /></SelectTrigger>
                  <SelectContent>
                    {EWALLETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{method === "bank" ? "Nomor Rekening" : "Nomor HP / ID E-Wallet"}</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={method === "bank" ? "1234567890" : "08123456789"} />
            </div>

            <div className="space-y-2">
              <Label>Nama Pemilik</Label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Sesuai dengan rekening" />
            </div>

            <div className="text-xs p-3 rounded-lg bg-muted/50 border space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-foreground"><Calendar className="h-3.5 w-3.5" /> Estimasi Pencairan</p>
              <p className="text-muted-foreground">Maksimal 3 hari kerja sejak diajukan, tidak termasuk Sabtu, Minggu, dan tanggal merah nasional.</p>
              <p className="font-semibold text-primary">Estimasi: {getEstimatedPayoutDate(new Date()).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Batal</Button>
            <Button onClick={submitWithdrawal} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              Ajukan Pencairan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherAffiliate;
