import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuperAdminPlans from "./SuperAdminPlans";
import SuperAdminSubscriptions from "./SuperAdminSubscriptions";
import SuperAdminAddons from "./SuperAdminAddons";

export default function SuperAdminSubscriptionsHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "plans";
  const setTab = (v: string) => setParams({ tab: v }, { replace: true });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="rounded-xl">
        <TabsTrigger value="plans" className="rounded-lg">Paket Langganan</TabsTrigger>
        <TabsTrigger value="schools" className="rounded-lg">Langganan Sekolah</TabsTrigger>
        <TabsTrigger value="addons" className="rounded-lg">Add-on</TabsTrigger>
      </TabsList>
      <TabsContent value="plans" className="mt-4"><SuperAdminPlans /></TabsContent>
      <TabsContent value="schools" className="mt-4"><SuperAdminSubscriptions /></TabsContent>
      <TabsContent value="addons" className="mt-4"><SuperAdminAddons /></TabsContent>
    </Tabs>
  );
}
