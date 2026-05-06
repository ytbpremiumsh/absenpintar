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
import SuperAdminBusinessModel from "./pages/super-admin/SuperAdminBusinessModel";
import SuperAdminTestimonials from "./pages/super-admin/SuperAdminTestimonials";
import SuperAdminLoginLogs from "./pages/super-admin/SuperAdminLoginLogs";
import SuperAdminReferral from "./pages/super-admin/SuperAdminReferral";
import LandingPage from "./pages/LandingPage";
import Panduan from "./pages/Panduan";
import PanduanDetail from "./pages/PanduanDetail";
import Presentation from "./pages/Presentation";
import BusinessModel from "./pages/BusinessModel";
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
import CustomDomain from "./pages/CustomDomain";
import Addons from "./pages/Addons";
import OrderIdCard from "./pages/OrderIdCard";
import WaCredit from "./pages/WaCredit";
import TeachingSchedule from "./pages/TeachingSchedule";
import LiveSchedule from "./pages/LiveSchedule";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAffiliate from "./pages/TeacherAffiliate";
import SchoolAnnouncements from "./pages/SchoolAnnouncements";
import ParentLogin from "./pages/parent/ParentLogin";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ManageBendahara from "./pages/ManageBendahara";
import { BendaharaLayout } from "./components/layout/BendaharaLayout";
import {
  BendaharaDashboard, BendaharaSiswa, BendaharaTarif, BendaharaGenerate,
  BendaharaTransaksi, BendaharaSPPDetail, BendaharaImportExport,
  BendaharaSaldo, BendaharaPencairan, BendaharaSettlement, BendaharaLaporan,
} from "./pages/bendahara/BendaharaPages";

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
      <Route path="/live/:schoolId" element={<PublicMonitoring />} />
      <Route path="/live/:schoolId/:className" element={<PublicClassMonitoring />} />
      <Route path="/attendance/:schoolId" element={<PublicAttendanceMonitoring />} />
      <Route path="/fitur" element={<Presentation />} />
      <Route path="/business-model" element={<BusinessModel />} />
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
        <Route path="/bendahara/saldo" element={<BendaharaSaldo />} />
        <Route path="/bendahara/pencairan" element={<BendaharaPencairan />} />
        <Route path="/bendahara/settlement" element={<BendaharaSettlement />} />
        <Route path="/bendahara/laporan" element={<BendaharaLaporan />} />
        <Route path="/bendahara/gateway" element={<Navigate to="/bendahara" replace />} />
      </Route>
      <Route element={<SuperAdminLayout />}>
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools" element={<SuperAdminSchools />} />
        <Route path="/super-admin/plans" element={<SuperAdminPlans />} />
        <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
        <Route path="/super-admin/payments" element={<SuperAdminPayments />} />
        <Route path="/super-admin/whatsapp" element={<SuperAdminWhatsApp />} />
        <Route path="/super-admin/branches" element={<SuperAdminBranches />} />
        <Route path="/super-admin/announcements" element={<SuperAdminAnnouncements />} />
        <Route path="/super-admin/tickets" element={<SuperAdminTickets />} />
        <Route path="/super-admin/landing" element={<SuperAdminLanding />} />
        <Route path="/super-admin/registration-wa" element={<SuperAdminRegistrationWA />} />
        <Route path="/super-admin/email" element={<SuperAdminEmail />} />
        <Route path="/super-admin/auto-caption" element={<SuperAdminAutoCaption />} />
        <Route path="/super-admin/fitur" element={<SuperAdminPresentation />} />
        <Route path="/super-admin/business-model" element={<SuperAdminBusinessModel />} />
        <Route path="/super-admin/testimonials" element={<SuperAdminTestimonials />} />
        <Route path="/super-admin/login-logs" element={<SuperAdminLoginLogs />} />
        <Route path="/super-admin/referral" element={<SuperAdminReferral />} />
        <Route path="/super-admin/penawaran" element={<SuperAdminPenawaran />} />
        <Route path="/super-admin/affiliate" element={<SuperAdminAffiliate />} />
        <Route path="/super-admin/backup" element={<SuperAdminBackup />} />
        <Route path="/super-admin/addons" element={<SuperAdminAddons />} />
        <Route path="/super-admin/server-info" element={<SuperAdminServerInfo />} />
        <Route path="/super-admin/bendahara" element={<SuperAdminBendahara />} />
      </Route>
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
        <Route path="/wali-kelas-dashboard" element={<WaliKelasDashboard />} />
        <Route path="/wali-kelas-attendance" element={<WaliKelasAttendance />} />
        <Route path="/wali-kelas-students" element={<WaliKelasStudents />} />
        <Route path="/wali-kelas-export" element={<WaliKelasExportHistory />} />
        <Route path="/wali-kelas-history" element={<WaliKelasHistoryPage />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        <Route path="/history" element={<History />} />
        <Route path="/export-history" element={<ExportHistory />} />
        <Route path="/edit-attendance" element={<EditAttendance />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/school-settings" element={<SchoolSettings />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/support" element={<SupportTickets />} />
        <Route path="/referral" element={<ReferralDashboard />} />
        <Route path="/affiliate-teacher" element={<TeacherAffiliate />} />
        <Route path="/whatsapp" element={<WhatsAppSettings />} />
        <Route path="/addons" element={<Addons />} />
        <Route path="/custom-domain" element={<CustomDomain />} />
        <Route path="/order-idcard" element={<OrderIdCard />} />
        <Route path="/wa-credit" element={<WaCredit />} />
        <Route path="/teaching-schedule" element={<TeachingSchedule />} />
        <Route path="/live-schedule" element={<LiveSchedule />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
