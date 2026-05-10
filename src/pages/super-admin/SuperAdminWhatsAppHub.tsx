import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuperAdminWhatsApp from "./SuperAdminWhatsApp";
import SuperAdminRegistrationWA from "./SuperAdminRegistrationWA";

export default function SuperAdminWhatsAppHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "api";
  const setTab = (v: string) => setParams({ tab: v }, { replace: true });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="rounded-xl">
        <TabsTrigger value="api" className="rounded-lg">Konfigurasi API</TabsTrigger>
        <TabsTrigger value="aktivasi" className="rounded-lg">Aktivasi Sekolah</TabsTrigger>
      </TabsList>
      <TabsContent value="api" className="mt-4"><SuperAdminWhatsApp /></TabsContent>
      <TabsContent value="aktivasi" className="mt-4"><SuperAdminRegistrationWA /></TabsContent>
    </Tabs>
  );
}
