import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useLocation } from "react-router-dom";

import { Chatbot } from "@/components/Chatbot";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Register from "@/pages/Register";
import BloodBanks from "@/pages/BloodBanks";
import EmergencyStatusPage from "@/pages/EmergencyStatus";
import HospitalDashboard from "@/pages/hospital/HospitalDashboard";
import PatientDashboard from "@/patient/PatientDashboard";
//import DonorDashboard from "@/pages/DonorDashboard";
import DonorDashboard from "@/donor/DonorDashboard";

import AdminDashboard from "@/pages/AdminDashboard";
import BloodBankDashboard from "@/pages/BloodBankDashboard";
import VolunteerDashboard from "@/pages/VolunteerDashboard";
import NotFound from "@/pages/NotFound";

// React Query client (v4 compatible)
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {/* Global Notifications */}
          <Toaster />
          <Sonner />

          <BrowserRouter>
            {/* Global Navbar */}
            <Navbar />

            {/* 🔥 IMPORTANT: Navbar spacer (DO NOT REMOVE) */}
            <div className="h-[80px]" />

            {/* App Routes */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/blood-banks" element={<BloodBanks />} />
              <Route
                path="/status/:requestId"
                element={<EmergencyStatusPage />}
              />

              {/* Dashboards */}
              <Route path="/hospital" element={<HospitalDashboard />} />
              <Route path="/hospital/overview" element={<HospitalDashboard />} />
              <Route path="/hospital/emergencies" element={<HospitalDashboard />} />
              <Route path="/hospital/blood" element={<HospitalDashboard />} />
              <Route path="/hospital/live" element={<HospitalDashboard />} />
              <Route path="/hospital/history" element={<HospitalDashboard />} />
              <Route path="/hospital/notifications" element={<HospitalDashboard />} />
              <Route path="/hospital/profile" element={<HospitalDashboard />} />
              <Route
                path="/dashboard/patient"
                element={<PatientDashboard />}
              />
              <Route
                path="/dashboard/donor"
                element={<DonorDashboard />}
              />
              <Route
                path="/dashboard/admin"
                element={<AdminDashboard />}
              />
              <Route
                path="/dashboard/blood-bank"
                element={<BloodBankDashboard />}
              />
              <Route
                path="/dashboard/volunteer"
                element={<VolunteerDashboard />}
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global Utilities */}
            <Chatbot />
            <OfflineIndicator />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
