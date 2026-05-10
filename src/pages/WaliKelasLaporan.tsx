import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WaliKelasExportHistory from "./WaliKelasExportHistory";
import WaliKelasHistory from "./WaliKelasHistory";

export default function WaliKelasLaporan() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "rekap";
  const setTab = (v: string) => setParams({ tab: v }, { replace: true });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="rekap" className="rounded-lg">Rekap</TabsTrigger>
          <TabsTrigger value="analitik" className="rounded-lg">Analitik</TabsTrigger>
        </TabsList>
        <TabsContent value="rekap" className="mt-4"><WaliKelasExportHistory /></TabsContent>
        <TabsContent value="analitik" className="mt-4"><WaliKelasHistory /></TabsContent>
      </Tabs>
    </div>
  );
}
