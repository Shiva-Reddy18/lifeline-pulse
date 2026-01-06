import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Index from "./pages/Index";
import PendingVerification from "@/pages/PendingVerification";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import BloodBanks from "./pages/BloodBanks";
import EmergencyStatusPage from "./pages/EmergencyStatus";
import HospitalDashboard from "./pages/HospitalDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BloodBankDashboard from "./pages/BloodBankDashboard";
import VolunteerDashboard from "./Volunteer/VolunteerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/blood-banks" element={<BloodBanks />} />
            <Route path="/status/:requestId" element={<EmergencyStatusPage />} />
            <Route path="/hospital" element={<HospitalDashboard />} />
            <Route path="/dashboard/patient" element={<PatientDashboard />} />
            <Route path="/dashboard/donor" element={<DonorDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/dashboard/blood-bank" element={<BloodBankDashboard />} />
            <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Chatbot />
          <OfflineIndicator />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
