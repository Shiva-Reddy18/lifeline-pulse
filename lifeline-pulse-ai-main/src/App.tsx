import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";
import { OfflineIndicator } from "@/components/OfflineIndicator";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import PendingVerification from "@/pages/PendingVerification";
import VolunteerGate from "./Volunteer/VolunteerGate";
import BloodBanks from "./pages/BloodBanks";
import EmergencyStatusPage from "./pages/EmergencyStatus";

import HospitalDashboard from "./pages/HospitalDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BloodBankDashboard from "@/bloodbank/BloodBankDashboard";
import VolunteerDashboard from "./Volunteer/VolunteerDashboard";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

/* ---------------- App Wrapper ---------------- */

function AppContent() {
  const location = useLocation();

  // ❌ Hide Navbar on dashboards
  const hideNavbar = location.pathname.startsWith("/dashboard");

  return (
    <>
      <Toaster />
      <Sonner />

      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ---------------- Public Routes ---------------- */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/blood-banks" element={<BloodBanks />} />
        <Route path="/status/:requestId" element={<EmergencyStatusPage />} />
        <Route path="/pending-verification" element={<PendingVerification />} />

        {/* ---------------- Dashboards ---------------- */}
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/donor" element={<DonorDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/blood-bank" element={<BloodBankDashboard />} />

        {/* ✅ VOLUNTEER DASHBOARD (PROTECTED) */}
        <Route
          path="/dashboard/volunteer"
          element={
            <VolunteerGate>
              <VolunteerDashboard />
            </VolunteerGate>
          }
        />

        {/* ---------------- 404 ---------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Chatbot />
      <OfflineIndicator />
    </>
  );
}

/* ---------------- Export ---------------- */

export default function App() {
  return <AppContent />;
}
