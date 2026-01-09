import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

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
import DonorDashboard from "@/donor/DonorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import BloodBankDashboard from "@/pages/BloodBankDashboard";
import VolunteerDashboard from "@/pages/VolunteerDashboard";
import NotFound from "@/pages/NotFound";

// React Query client
const queryClient = new QueryClient();

/* 🔥 This wrapper controls when the global Navbar is visible */
function LayoutWithNavbar() {
  const location = useLocation();

  const hideNavbarOn = [
    "/dashboard/patient",
    "/dashboard/donor",
    "/dashboard/admin",
    "/dashboard/blood-bank",
    "/dashboard/volunteer",
    "/hospital"
  ];

  const shouldHideNavbar = hideNavbarOn.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      {!shouldHideNavbar && <div className="h-[80px]" />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        {/* /* <Route path="/blood-banks" element={<BloodBanks />} /> */ }
        <Route path="/status/:requestId" element={<EmergencyStatusPage />} />

        {/* Dashboards */}
        <Route path="/hospital/*" element={<HospitalDashboard />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/donor" element={<DonorDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/blood-bank" element={<BloodBankDashboard />} />
        <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <LayoutWithNavbar />

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
