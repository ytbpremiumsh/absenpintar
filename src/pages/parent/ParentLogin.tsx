import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, GraduationCap, MessageSquare } from "lucide-react";

export default function ParentLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("parent_token")) navigate("/parent");
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestOtp = async () => {
    if (!phone || phone.length < 9) return toast.error("Nomor WA tidak valid");
    setLoading(true);
    const { data } = await supabase.functions.invoke("parent-portal", {
      body: { action: "request_otp", phone },
    });
    setLoading(false);
    if (data?.error) return toast.error(data.error);
    toast.success("Kode OTP dikirim via WhatsApp");
    setStep("otp");
    setCooldown(60);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return toast.error("Kode harus 6 digit");
    setLoading(true);
    const { data } = await supabase.functions.invoke("parent-portal", {
      body: { action: "verify_otp", phone, otp },
    });
    setLoading(false);
    if (data?.error) return toast.error(data.error);
    localStorage.setItem("parent_token", data.token);
    localStorage.setItem("parent_phone", data.phone);
    toast.success("Login berhasil");
    navigate("/parent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5B6CF9]/10 via-background to-background p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 border-0 shadow-elevated">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#4c5ded] flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Dashboard Wali Murid</h1>
          <p className="text-sm text-muted-foreground mt-1">Login dengan nomor WhatsApp terdaftar</p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nomor WhatsApp</Label>
              <Input
                type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Gunakan nomor yang sama dengan yang terdaftar di sekolah anak Anda.
              </p>
            </div>
            <Button onClick={requestOtp} disabled={loading} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><MessageSquare className="h-4 w-4 mr-2" /> Kirim Kode OTP</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Kode OTP (6 digit)</Label>
              <Input
                type="text" inputMode="numeric" maxLength={6} placeholder="------"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-bold"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Kode dikirim ke <strong>{phone}</strong> via WhatsApp.
              </p>
            </div>
            <Button onClick={verifyOtp} disabled={loading} className="w-full bg-[#5B6CF9] hover:bg-[#4c5ded] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => setStep("phone")} className="text-muted-foreground hover:text-foreground">← Ganti nomor</button>
              <button onClick={requestOtp} disabled={cooldown > 0 || loading} className="text-[#5B6CF9] disabled:text-muted-foreground">
                {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang OTP"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
