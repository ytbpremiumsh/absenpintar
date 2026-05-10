import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Subscription from "./Subscription";
import Addons from "./Addons";

export default function LanggananCombined() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "paket";
  const setTab = (v: string) => setParams({ tab: v }, { replace: true });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="paket" className="rounded-lg">Paket Langganan</TabsTrigger>
          <TabsTrigger value="addon" className="rounded-lg">Add-on</TabsTrigger>
        </TabsList>
        <TabsContent value="paket" className="mt-4"><Subscription /></TabsContent>
        <TabsContent value="addon" className="mt-4"><Addons /></TabsContent>
      </Tabs>
    </div>
  );
}
