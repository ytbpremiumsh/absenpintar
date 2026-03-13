import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PremiumGate } from "@/components/PremiumGate";

const WhatsAppHistory = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const schoolId = profile?.school_id;

  useEffect(() => {
    if (!schoolId) return;
    supabase
      .from("wa_message_logs" as any)
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, [schoolId]);

  return (
    <PremiumGate featureLabel="WhatsApp Gateway" requiredPlan="Premium">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 sm:h-6 sm:w-6" />
            Riwayat Pesan WhatsApp
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Log pengiriman pesan WhatsApp otomatis dan broadcast
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Memuat riwayat...</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Belum ada riwayat pengiriman pesan
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.student_name && <span className="font-semibold text-xs">{log.student_name}</span>}
                        <Badge variant="secondary" className="text-[10px]">{log.message_type}</Badge>
                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-[10px]">
                          {log.status === 'sent' ? 'Terkirim' : 'Gagal'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{log.phone || log.group_id}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PremiumGate>
  );
};

export default WhatsAppHistory;
