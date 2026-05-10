import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppLayout } from "@/components/layout/AppLayout";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { LoadingScreen } from "@/components/LoadingScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import ScanQR from "./pages/ScanQR";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import ManageWaliKelas from "./pages/ManageWaliKelas";
import ManageStaff from "./pages/ManageStaff";
import WaliKelasDashboard from "./pages/WaliKelasDashboard";
import WaliKelasAttendance from "./pages/WaliKelasAttendance";
import WaliKelasStudents from "./pages/WaliKelasStudents";
import WaliKelasExportHistory from "./pages/WaliKelasExportHistory";
import WaliKelasHistoryPage from "./pages/WaliKelasHistory";
import LeaveRequests from "./pages/LeaveRequests";
import History from "./pages/History";
import Subscription from "./pages/Subscription";
import PublicMonitoring from "./pages/PublicMonitoring";
import PublicClassMonitoring from "./pages/PublicClassMonitoring";
import PublicAttendanceMonitoring from "./pages/PublicAttendanceMonitoring";
import SchoolSettings from "./pages/SchoolSettings";
import AccountSettings from "./pages/AccountSettings";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminSchools from "./pages/super-admin/SuperAdminSchools";
import SuperAdminPlans from "./pages/super-admin/SuperAdminPlans";
import SuperAdminPayments from "./pages/super-admin/SuperAdminPayments";
import SuperAdminSubscriptions from "./pages/super-admin/SuperAdminSubscriptions";
import SuperAdminWhatsApp from "./pages/super-admin/SuperAdminWhatsApp";
import SuperAdminBranches from "./pages/super-admin/SuperAdminBranches";
import ExportHistory from "./pages/ExportHistory";
import EditAttendance from "./pages/EditAttendance";
import SupportTickets from "./pages/SupportTickets";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import SuperAdminAnnouncements from "./pages/super-admin/SuperAdminAnnouncements";
import SuperAdminTickets from "./pages/super-admin/SuperAdminTickets";
import SuperAdminLanding from "./pages/super-admin/SuperAdminLanding";
import SuperAdminRegistrationWA from "./pages/super-admin/SuperAdminRegistrationWA";
import SuperAdminEmail from "./pages/super-admin/SuperAdminEmail";
import SuperAdminAutoCaption from "./pages/super-admin/SuperAdminAutoCaption";
import SuperAdminPresentation from "./pages/super-admin/SuperAdminPresentation";

import SuperAdminTestimonials from "./pages/super-admin/SuperAdminTestimonials";
import SuperAdminLoginLogs from "./pages/super-admin/SuperAdminLoginLogs";
import SuperAdminReferral from "./pages/super-admin/SuperAdminReferral";
import LandingPage from "./pages/LandingPage";
import Panduan from "./pages/Panduan";
import PanduanDetail from "./pages/PanduanDetail";
import Presentation from "./pages/Presentation";

import Proposal from "./pages/Proposal";
import PitchDeck from "./pages/PitchDeck";
import ReferralDashboard from "./pages/ReferralDashboard";
import NotFound from "./pages/NotFound";
import Penawaran from "./pages/Penawaran";
import SuperAdminPenawaran from "./pages/super-admin/SuperAdminPenawaran";
import ForgotPassword from "./pages/ForgotPassword";
import AffiliateRegister from "./pages/AffiliateRegister";
import AffiliateLogin from "./pages/AffiliateLogin";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import SuperAdminAffiliate from "./pages/super-admin/SuperAdminAffiliate";
import SuperAdminBackup from "./pages/super-admin/SuperAdminBackup";
import SuperAdminAddons from "./pages/super-admin/SuperAdminAddons";
import SuperAdminServerInfo from "./pages/super-admin/SuperAdminServerInfo";
import SuperAdminBendahara from "./pages/super-admin/SuperAdminBendahara";
import SuperAdminShortlinks from "./pages/super-admin/SuperAdminShortlinks";
import ShortlinkRedirect from "./pages/ShortlinkRedirect";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import SuperAdminPanduan from "./pages/super-admin/SuperAdminPanduan";
import CustomDomain from "./pages/CustomDomain";
import Addons from "./pages/Addons";
import OrderIdCard from "./pages/OrderIdCard";
import WaCredit from "./pages/WaCredit";
import TeachingSchedule from "./pages/TeachingSchedule";
import LiveSchedule from "./pages/LiveSchedule";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAffiliate from "./pages/TeacherAffiliate";
import SchoolAnnouncements from "./pages/SchoolAnnouncements";
import TeacherAttendanceRecap from "./pages/TeacherAttendanceRecap";
import ParentLogin from "./pages/parent/ParentLogin";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ManageBendahara from "./pages/ManageBendahara";
import SelectRole from "./pages/SelectRole";
import { BendaharaLayout } from "./components/layout/BendaharaLayout";
import {
  BendaharaDashboard, BendaharaSiswa, BendaharaTarif, BendaharaGenerate,
  BendaharaTransaksi, BendaharaSPPDetail, BendaharaImportExport,
  BendaharaSaldo, BendaharaPencairan, BendaharaSettlement, BendaharaLaporan,
} from "./pages/bendahara/BendaharaPages";
import BendaharaKeuangan from "./pages/bendahara/BendaharaKeuangan";
import LaporanAbsensi from "./pages/LaporanAbsensi";
import JadwalCombined from "./pages/JadwalCombined";
import LanggananCombined from "./pages/LanggananCombined";
import WaliKelasLaporan from "./pages/WaliKelasLaporan";
import MapelLaporan from "./pages/MapelLaporan";
import TeacherWaliDashboard from "./pages/TeacherWaliDashboard";
import SuperAdminSubscriptionsHub from "./pages/super-admin/SuperAdminSubscriptionsHub";
import SuperAdminWhatsAppHub from "./pages/super-admin/SuperAdminWhatsAppHub";
import SuperAdminCMS from "./pages/super-admin/SuperAdminCMS";
import SuperAdminSekolahHub from "./pages/super-admin/SuperAdminSekolahHub";

const queryClient = new QueryClient();

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/panduan" element={<Panduan />} />
      <Route path="/panduan/:role" element={<PanduanDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/live/:schoolId" element={<PublicMonitoring />} />
      <Route path="/live/:schoolId/:className" element={<PublicClassMonitoring />} />
      <Route path="/attendance/:schoolId" element={<PublicAttendanceMonitoring />} />
      <Route path="/fitur" element={<Presentation />} />
      
      <Route path="/penawaran" element={<Penawaran />} />
      <Route path="/proposal" element={<Proposal />} />
      <Route path="/pitchdeck" element={<PitchDeck />} />
      <Route path="/affiliate/register" element={<AffiliateRegister />} />
      <Route path="/affiliate/login" element={<AffiliateLogin />} />
      <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
      <Route path="/parent/login" element={<ParentLogin />} />
      <Route path="/parent" element={<ParentDashboard />} />
      {/* Bendahara */}
      <Route element={<BendaharaLayout />}>
        <Route path="/bendahara" element={<BendaharaDashboard />} />
        <Route path="/bendahara/siswa" element={<BendaharaSiswa />} />
        <Route path="/bendahara/tarif" element={<BendaharaTarif />} />
        <Route path="/bendahara/generate" element={<BendaharaGenerate />} />
        <Route path="/bendahara/transaksi" element={<BendaharaTransaksi />} />
        <Route path="/bendahara/transaksi/:studentId" element={<BendaharaSPPDetail />} />
        <Route path="/bendahara/import-export" element={<BendaharaImportExport />} />
        <Route path="/bendahara/keuangan" element={<BendaharaKeuangan />} />
        <Route path="/bendahara/saldo" element={<Navigate to="/bendahara/keuangan?tab=saldo" replace />} />
        <Route path="/bendahara/pencairan" element={<Navigate to="/bendahara/keuangan?tab=pencairan" replace />} />
        <Route path="/bendahara/laporan" element={<Navigate to="/bendahara/keuangan?tab=laporan" replace />} />
        <Route path="/bendahara/settlement" element={<BendaharaSettlement />} />
        <Route path="/bendahara/gateway" element={<Navigate to="/bendahara" replace />} />
      </Route>
      <Route element={<SuperAdminLayout />}>
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        {/* Sekolah Hub */}
        <Route path="/super-admin/sekolah" element={<SuperAdminSekolahHub />} />
        <Route path="/super-admin/schools" element={<Navigate to="/super-admin/sekolah?tab=schools" replace />} />
        <Route path="/super-admin/branches" element={<Navigate to="/super-admin/sekolah?tab=branches" replace />} />
        <Route path="/super-admin/login-logs" element={<Navigate to="/super-admin/sekolah?tab=logs" replace />} />
        {/* Subscriptions Hub */}
        <Route path="/super-admin/langganan" element={<SuperAdminSubscriptionsHub />} />
        <Route path="/super-admin/plans" element={<Navigate to="/super-admin/langganan?tab=plans" replace />} />
        <Route path="/super-admin/subscriptions" element={<Navigate to="/super-admin/langganan?tab=schools" replace />} />
        <Route path="/super-admin/addons" element={<Navigate to="/super-admin/langganan?tab=addons" replace />} />
        <Route path="/super-admin/payments" element={<SuperAdminPayments />} />
        {/* WhatsApp Hub */}
        <Route path="/super-admin/wa" element={<SuperAdminWhatsAppHub />} />
        <Route path="/super-admin/whatsapp" element={<Navigate to="/super-admin/wa?tab=api" replace />} />
        <Route path="/super-admin/registration-wa" element={<Navigate to="/super-admin/wa?tab=aktivasi" replace />} />
        <Route path="/super-admin/announcements" element={<SuperAdminAnnouncements />} />
        <Route path="/super-admin/tickets" element={<SuperAdminTickets />} />
        <Route path="/super-admin/email" element={<SuperAdminEmail />} />
        {/* CMS Hub */}
        <Route path="/super-admin/cms" element={<SuperAdminCMS />} />
        <Route path="/super-admin/landing" element={<Navigate to="/super-admin/cms?tab=landing" replace />} />
        <Route path="/super-admin/fitur" element={<Navigate to="/super-admin/cms?tab=fitur" replace />} />
        <Route path="/super-admin/penawaran" element={<Navigate to="/super-admin/cms?tab=penawaran" replace />} />
        <Route path="/super-admin/panduan" element={<Navigate to="/super-admin/cms?tab=panduan" replace />} />
        <Route path="/super-admin/testimonials" element={<Navigate to="/super-admin/cms?tab=testimoni" replace />} />
        <Route path="/super-admin/auto-caption" element={<Navigate to="/super-admin/cms?tab=caption" replace />} />
        <Route path="/super-admin/referral" element={<SuperAdminReferral />} />
        <Route path="/super-admin/affiliate" element={<SuperAdminAffiliate />} />
        <Route path="/super-admin/backup" element={<SuperAdminBackup />} />
        <Route path="/super-admin/server-info" element={<SuperAdminServerInfo />} />
        <Route path="/super-admin/bendahara" element={<SuperAdminBendahara />} />
        <Route path="/super-admin/shortlinks" element={<SuperAdminShortlinks />} />
      </Route>
      <Route path="/s/:code" element={<ShortlinkRedirect />} />
      {/* School Admin / Staff */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/wali-kelas" element={<ManageWaliKelas />} />
        <Route path="/staff" element={<ManageStaff />} />
        <Route path="/bendahara-manage" element={<ManageBendahara />} />
        {/* Teacher + Wali Kelas dashboard tabbed */}
        <Route path="/teacher-dashboard" element={<TeacherWaliDashboard />} />
        <Route path="/wali-kelas-dashboard" element={<Navigate to="/teacher-dashboard?tab=wali" replace />} />
        <Route path="/wali-kelas-attendance" element={<WaliKelasAttendance />} />
        <Route path="/wali-kelas-students" element={<WaliKelasStudents />} />
        {/* Wali Kelas Laporan tabbed */}
        <Route path="/wali-kelas/laporan" element={<WaliKelasLaporan />} />
        <Route path="/wali-kelas-export" element={<Navigate to="/wali-kelas/laporan?tab=rekap" replace />} />
        <Route path="/wali-kelas-history" element={<Navigate to="/wali-kelas/laporan?tab=analitik" replace />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        {/* Laporan Absensi tabbed (admin/operator) */}
        <Route path="/laporan-absensi" element={<LaporanAbsensi />} />
        <Route path="/history" element={<Navigate to="/laporan-absensi?tab=analitik" replace />} />
        <Route path="/export-history" element={<Navigate to="/laporan-absensi?tab=rekap" replace />} />
        <Route path="/edit-attendance" element={<Navigate to="/laporan-absensi?tab=riwayat" replace />} />
        {/* Mapel Laporan tabbed (guru) */}
        <Route path="/mapel/laporan" element={<MapelLaporan />} />
        <Route path="/teacher-attendance" element={<TeacherAttendanceRecap />} />
        {/* Langganan tabbed */}
        <Route path="/langganan" element={<LanggananCombined />} />
        <Route path="/subscription" element={<Navigate to="/langganan?tab=paket" replace />} />
        <Route path="/addons" element={<Navigate to="/langganan?tab=addon" replace />} />
        <Route path="/school-settings" element={<SchoolSettings />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/support" element={<SupportTickets />} />
        <Route path="/referral" element={<ReferralDashboard />} />
        <Route path="/affiliate-teacher" element={<TeacherAffiliate />} />
        <Route path="/whatsapp" element={<WhatsAppSettings />} />
        <Route path="/custom-domain" element={<CustomDomain />} />
        <Route path="/order-idcard" element={<OrderIdCard />} />
        <Route path="/wa-credit" element={<WaCredit />} />
        {/* Jadwal tabbed */}
        <Route path="/jadwal" element={<JadwalCombined />} />
        <Route path="/teaching-schedule" element={<Navigate to="/jadwal?tab=mengajar" replace />} />
        <Route path="/live-schedule" element={<Navigate to="/jadwal?tab=live" replace />} />
        <Route path="/announcements" element={<SchoolAnnouncements />} />
        <Route path="/wa-templates" element={<Navigate to="/whatsapp" replace />} />
        <Route path="/wa-broadcast" element={<Navigate to="/whatsapp" replace />} />
        <Route path="/wa-history" element={<Navigate to="/whatsapp" replace />} />
        <Route path="/whatsapp-settings" element={<Navigate to="/whatsapp" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DynamicFavicon />
      <BrowserRouter>
        <AuthProvider>
          <GoogleAnalytics />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
