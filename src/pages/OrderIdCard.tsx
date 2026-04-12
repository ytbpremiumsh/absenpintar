import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Users, Image, ShoppingCart, CheckCircle2, Clock, Truck, Printer, Package, ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import idcardDesign1 from "@/assets/idcard-design-1.png";
import idcardDesign2 from "@/assets/idcard-design-2.png";
import idcardDesign3 from "@/assets/idcard-design-3.png";

const fallbackDesigns = [
  { id: "fallback-1", name: "Blue Professional", preview_url: idcardDesign1 },
  { id: "fallback-2", name: "Colorful Kids", preview_url: idcardDesign2 },
  { id: "fallback-3", name: "Navy Gold Elegant", preview_url: idcardDesign3 },
];

const PROGRESS_STEPS = [
  { key: "waiting_payment", label: "Menunggu Bayar", icon: Clock, pct: 10 },
  { key: "paid", label: "Dibayar", icon: CheckCircle2, pct: 30 },
  { key: "processing", label: "Diproses", icon: Package, pct: 50 },
  { key: "printing", label: "Dicetak", icon: Printer, pct: 70 },
  { key: "shipping", label: "Dikirim", icon: Truck, pct: 90 },
  { key: "completed", label: "Selesai", icon: CheckCircle2, pct: 100 },
];

const OrderIdCard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "design" | "confirm" | "history">("history");
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<string>("");
  const [pricePerCard, setPricePerCard] = useState(7000);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    const load = async () => {
      const [studRes, designRes, orderRes, priceRes] = await Promise.all([
        supabase.from("students").select("id, name, class, student_id").eq("school_id", profile.school_id).order("class").order("name"),
        supabase.from("id_card_designs").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("id_card_orders").select("*, id_card_designs(name, preview_url)").eq("school_id", profile.school_id).order("created_at", { ascending: false }),
        supabase.from("platform_settings").select("value").eq("key", "idcard_price_per_card").maybeSingle(),
      ]);

      const studs = studRes.data || [];
      setStudents(studs);
      const uniqueClasses = [...new Set(studs.map((s: any) => s.class))].sort();
      setClasses(uniqueClasses);

      const dbDesigns = designRes.data || [];
      setDesigns(dbDesigns.length > 0 ? dbDesigns : fallbackDesigns);

      setOrders(orderRes.data || []);
      if (priceRes.data?.value) setPricePerCard(parseInt(priceRes.data.value) || 7000);
      setLoading(false);
    };
    load();
  }, [profile?.school_id]);

  const filteredStudents = selectedClass && selectedClass !== "all"
    ? students.filter((s) => s.class === selectedClass)
    : students;

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const totalAmount = selectedStudents.size * pricePerCard;

  const handleSubmitOrder = async () => {
    if (!profile?.school_id || selectedStudents.size === 0 || !selectedDesign) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("id_card_orders").insert({
        school_id: profile.school_id,
        design_id: selectedDesign.startsWith("fallback") ? null : selectedDesign,
        total_cards: selectedStudents.size,
        price_per_card: pricePerCard,
        total_amount: totalAmount,
        status: "pending",
        progress: "waiting_payment",
      }).select("id").single();

      if (error) throw error;

      const items = Array.from(selectedStudents).map((sid) => {
        const st = students.find((s) => s.id === sid);
        return {
          order_id: order.id,
          student_id: sid,
          student_name: st?.name || "",
          student_class: st?.class || "",
        };
      });
      await supabase.from("id_card_order_items").insert(items);

      toast.success("Pesanan berhasil dibuat!");
      setStep("history");
      setSelectedStudents(new Set());
      setSelectedDesign("");
      // Refresh orders
      const { data: newOrders } = await supabase.from("id_card_orders")
        .select("*, id_card_designs(name, preview_url)")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false });
      setOrders(newOrders || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat pesanan");
    }
    setSubmitting(false);
  };

  const getProgressPct = (progress: string) => {
    return PROGRESS_STEPS.find((s) => s.key === progress)?.pct || 0;
  };

  const getProgressLabel = (progress: string) => {
    return PROGRESS_STEPS.find((s) => s.key === progress)?.label || progress;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/addons")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Pesan ID Card Siswa
          </h1>
          <p className="text-muted-foreground text-sm">Cetak kartu identitas siswa dengan desain profesional</p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={step === "history" ? "default" : "outline"} onClick={() => setStep("history")}>
          Riwayat Pesanan
        </Button>
        <Button size="sm" variant={step === "select" ? "default" : "outline"} onClick={() => setStep("select")}>
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Pesan Baru
        </Button>
      </div>

      {step === "history" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground mb-3">Belum ada pesanan ID Card</p>
                <Button onClick={() => setStep("select")}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Pesan Sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{order.total_cards} Kartu</span>
                        <Badge variant="outline" className="text-[10px]">
                          {(order as any).id_card_designs?.name || "Desain Default"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total: Rp {(order.total_amount || 0).toLocaleString("id-ID")} •{" "}
                        {new Date(order.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <Badge
                      variant={order.progress === "completed" ? "default" : "secondary"}
                      className="text-xs w-fit"
                    >
                      {getProgressLabel(order.progress)}
                    </Badge>
                  </div>
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={getProgressPct(order.progress)} className="h-2" />
                    <div className="flex justify-between">
                      {PROGRESS_STEPS.map((s, i) => {
                        const reached = getProgressPct(order.progress) >= s.pct;
                        return (
                          <div key={s.key} className="flex flex-col items-center">
                            <s.icon className={`h-3 w-3 ${reached ? "text-primary" : "text-muted-foreground/40"}`} />
                            <span className={`text-[8px] mt-0.5 ${reached ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {step === "select" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Pilih Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedStudents.size === filteredStudents.length ? "Batal Semua" : "Pilih Semua"}
              </Button>
              <Badge variant="secondary">{selectedStudents.size} dipilih</Badge>
            </div>

            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
              {filteredStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selectedStudents.has(s.id)}
                    onCheckedChange={() => toggleStudent(s.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">NIS: {s.student_id} • {s.class}</p>
                  </div>
                </label>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Tidak ada siswa</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button disabled={selectedStudents.size === 0} onClick={() => setStep("design")}>
                Lanjut Pilih Desain <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "design" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" /> Pilih Desain Kartu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((d) => (
                <div
                  key={d.id}
                  className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                    selectedDesign === d.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedDesign(d.id)}
                >
                  {d.preview_url && (
                    <img
                      src={d.preview_url}
                      alt={d.name}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{d.name}</span>
                    {selectedDesign === d.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("select")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <Button disabled={!selectedDesign} onClick={() => setStep("confirm")}>
                Lanjut Konfirmasi <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Konfirmasi Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jumlah Kartu</span>
                <span className="font-semibold">{selectedStudents.size} kartu</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga per Kartu</span>
                <span className="font-semibold">Rp {pricePerCard.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desain</span>
                <span className="font-semibold">{designs.find((d) => d.id === selectedDesign)?.name || "—"}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">Total Biaya</span>
                <span className="font-extrabold text-lg text-primary">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Selected design preview */}
            {selectedDesign && (
              <div className="flex justify-center">
                <img
                  src={designs.find((d) => d.id === selectedDesign)?.preview_url}
                  alt="Design Preview"
                  className="max-w-xs rounded-lg border shadow-sm"
                  loading="lazy"
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("design")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <Button onClick={handleSubmitOrder} disabled={submitting}>
                {submitting ? "Memproses..." : "Buat Pesanan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderIdCard;
