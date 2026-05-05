import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BendaharaSidebar } from "./BendaharaSidebar";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationBell } from "@/components/NotificationBell";

export function BendaharaLayout() {
  const { user, roles, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes("bendahara") && !roles.includes("school_admin") && !roles.includes("super_admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <BendaharaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-30 px-3 gap-2">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-muted-foreground flex-1 truncate">Bendahara · Sistem Keuangan Sekolah</span>
            <NotificationBell />
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
