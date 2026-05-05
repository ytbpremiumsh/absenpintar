import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Facebook, Instagram, Twitter, MessageCircle, Linkedin, Music2, FileText, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const SAMPLE_FB = `🚀 Sekolah Anda masih repot dengan absensi manual? Saatnya naik level dengan ATSkolla — sistem absensi sekolah cerdas berbasis AI & QR Code.

Dengan ATSkolla, setiap siswa bisa absen hanya dengan scan QR atau Face Recognition. Begitu anak tiba di sekolah, orang tua langsung menerima notifikasi WhatsApp otomatis. Saat pulang? Mereka juga tahu tepat waktu. Tidak ada lagi kekhawatiran "anak saya sudah sampai sekolah belum?" 🙌

✨ Yang bikin ATSkolla beda:
✓ Absensi via QR Code, Face Recognition (AI), atau Manual
✓ Notifikasi WhatsApp real-time ke orang tua
✓ Dashboard khusus Wali Kelas
✓ Laporan kehadiran PDF & Excel siap cetak
✓ Pembayaran SPP online otomatis
✓ Multi-role: Admin, Bendahara, Guru, Wali Kelas
✓ Bisa pakai domain sendiri (sekolahmu.id)

Cocok untuk SD, SMP, SMA, SMK, MA & Pesantren — dari sekolah kecil sampai yayasan besar.

🎁 Coba GRATIS 7 hari Premium tanpa kartu kredit! Buktikan sendiri kemudahannya.

👉 Daftar sekarang: https://absenpintar.online
💬 Konsultasi gratis: wa.me/6281234567890

#ATSkolla #AbsensiSekolah #SekolahDigital #PendidikanIndonesia #EdTech`;

const platforms = [
  { v: "facebook", label: "Facebook", icon: Facebook },
  { v: "instagram", label: "Instagram", icon: Instagram },
  { v: "tiktok", label: "TikTok", icon: Music2 },
  { v: "twitter", label: "Twitter / X", icon: Twitter },
  { v: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { v: "linkedin", label: "LinkedIn", icon: Linkedin },
  { v: "blog", label: "Blog / Artikel", icon: FileText },
];

const tones = [
  { v: "profesional", label: "Profesional" },
  { v: "santai", label: "Santai" },
  { v: "persuasif", label: "Persuasif (Hard-sell)" },
  { v: "edukatif", label: "Edukatif" },
  { v: "promo", label: "Promo / Diskon" },
  { v: "storytelling", label: "Storytelling" },
];

const TOPIC_PRESETS = [
  "Perkenalan ATSkolla untuk sekolah yang masih pakai absen manual",
  "Keunggulan absensi via Face Recognition untuk SMA/SMK",
  "Manfaat notifikasi WhatsApp otomatis untuk orang tua",
  "Promo Trial Premium 7 hari gratis",
  "Solusi Wali Kelas: kelola kehadiran kelas lebih mudah",
  "Pembayaran SPP online tanpa antre",
  "Studi kasus sekolah yang sukses pakai ATSkolla",
  "Cara migrasi dari sistem absensi lama ke ATSkolla",
];

export default function SuperAdminAutoCaption() {
  const [platform, setPlatform] = useState<string>("facebook");
  const [tone, setTone] = useState<string>("persuasif");
  const [length, setLength] = useState<string>("sedang");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Kepala sekolah & yayasan SMA/SMK di Indonesia");
  const [cta, setCta] = useState("Daftar gratis di absenpintar.online");
  const [variants, setVariants] = useState(2);
  const [emoji, setEmoji] = useState(true);
  const [hashtags, setHashtags] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([SAMPLE_FB]);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Isi topik konten dulu");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("auto-caption", {
      body: { platform, tone, length, topic, audience, cta, variants, emoji, hashtags },
    });
    setLoading(false);
    if (error || !data?.success) {
      toast.error("Gagal: " + (data?.error || error?.message || "unknown"));
      return;
    }
    setResults(data.variants);
    toast.success(`${data.variants.length} varian berhasil dibuat`);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Caption disalin ke clipboard");
  };

  const PlatformIcon = platforms.find(p => p.v === platform)?.icon || Facebook;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Wand2}
        title="Auto Caption AI"
        subtitle="Generate konten marketing ATSkolla untuk Facebook, Instagram, TikTok, WhatsApp, dan lainnya."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Pengaturan Konten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.v} value={p.v}>
                      <span className="flex items-center gap-2"><p.icon className="h-3.5 w-3.5" /> {p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Topik Konten</Label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Misal: Perkenalan fitur Face Recognition AI untuk SMA"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TOPIC_PRESETS.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition border"
                  >
                    {t.length > 40 ? t.slice(0, 40) + "…" : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tone / Gaya</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tones.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Panjang</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendek">Pendek</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="panjang">Panjang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Target Audiens</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Misal: Kepala sekolah SMP/SMA" />
            </div>

            <div>
              <Label className="text-xs">Call To Action (CTA)</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Misal: Daftar gratis di absenpintar.online" />
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <Label className="text-xs">Varian</Label>
                <Input type="number" min={1} max={5} value={variants} onChange={(e) => setVariants(parseInt(e.target.value) || 1)} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={emoji} onCheckedChange={setEmoji} id="emoji" />
                <Label htmlFor="emoji" className="text-xs">Emoji</Label>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={hashtags} onCheckedChange={setHashtags} id="ht" />
                <Label htmlFor="ht" className="text-xs">Hashtag</Label>
              </div>
            </div>

            <Button onClick={generate} disabled={loading} className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Caption
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PlatformIcon className="h-4 w-4 text-primary" />
              Hasil Caption ({results.length})
            </h3>
            {results.length > 0 && results[0] === SAMPLE_FB && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Contoh — Facebook
              </span>
            )}
          </div>

          {results.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
              Belum ada caption. Isi form di kiri lalu klik <b>Generate</b>.
            </CardContent></Card>
          )}

          {results.map((text, i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="py-2.5 px-4 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-bold text-primary">VARIAN {i + 1}</span>
                <div className="flex gap-2">
                  <span className="text-[10px] text-muted-foreground">{text.length} karakter • {text.split(/\s+/).length} kata</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(text)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Salin
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">{text}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
