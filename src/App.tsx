import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Register from "@/pages/Register";
import BloodBanks from "@/pages/BloodBanks";
import EmergencyStatusPage from "@/pages/EmergencyStatus";
import HospitalDashboard from "@/pages/HospitalDashboard";
import PatientDashboard from "@/pages/PatientDashboard";
import DonorDashboard from "@/donor/DonorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import BloodBankDashboard from "@/pages/BloodBankDashboard";
import VolunteerDashboard from "@/pages/VolunteerDashboard";
import NotFound from "@/pages/NotFound";

// Initialize React Query client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {/* Global Toaster for notifications */}
          <Toaster position="top-right" />

          <BrowserRouter>
            {/* Navbar visible on all pages */}
            <Navbar />

            {/* App Routes */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/blood-banks" element={<BloodBanks />} />
              <Route path="/status/:requestId" element={<EmergencyStatusPage />} />

              {/* Dashboard Routes */}
              <Route path="/hospital" element={<HospitalDashboard />} />
              <Route path="/dashboard/patient" element={<PatientDashboard />} />
              <Route path="/dashboard/donor" element={<DonorDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/blood-bank" element={<BloodBankDashboard />} />
              <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />

              {/* 404 - Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
