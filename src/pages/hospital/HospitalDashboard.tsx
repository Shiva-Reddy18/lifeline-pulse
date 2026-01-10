// src/pages/hospital/HospitalDashboard.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Heart,
  Menu,
  LogOut,
  BarChart3,
  AlertTriangle,
  Droplet,
  FileText,
  Settings,
  Clock,
  X,
  Search,
  Plus,
  Loader2,
  MapPin,
  Users,
  Eye,
} from "lucide-react";

// child pages (we keep existing imports so we don't break router)
import Overview from "./Overview";
import EmergencyRequests from "./EmergencyRequests";
import BloodCoordination from "./BloodCoordination";
import HistoryRecords from "./HistoryRecords";
import Notifications from "./Notifications";
import ProfileSettings from "./ProfileSettings";

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hospitalName = "Hospital";

  // Extract the current page from the URL
  const currentPage = location.pathname.split("/hospital/").pop() || "overview";

  const menuItems = [
    { icon: BarChart3, label: "Overview", id: "overview", path: "/hospital/overview" },
    { icon: AlertTriangle, label: "Emergency Requests", id: "emergencies", path: "/hospital/emergencies" },
    { icon: Droplet, label: "Blood Coordination", id: "blood", path: "/hospital/blood" },
    { icon: FileText, label: "History & Records", id: "history", path: "/hospital/history" },
    { icon: Clock, label: "Notifications", id: "notifications", path: "/hospital/notifications" },
    { icon: Settings, label: "Profile & Settings", id: "profile", path: "/hospital/profile" },
  ];

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [signOut, navigate]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const openNotifications = () => navigate("/hospital/notifications");

  // Quick search handler (header)
  const handleQuickSearch = (q: string) => {
    // For demo: search may navigate to donors or inventory
    if (!q) return;
    // Simple heuristic
    if (q.match(/A|B|O|AB/gi)) {
      navigate("/hospital/blood");
    } else {
      navigate("/hospital/emergencies");
    }
  };

  // Simulated sync action
  const [loadingSync, setLoadingSync] = useState(false);
  const [auditItems, setAuditItems] = useState<Array<{ id: string; action: string; when: string }>>([]);
  const handleSync = async () => {
    setLoadingSync(true);
    // simulate network
    await new Promise((r) => setTimeout(r, 700));
    setAuditItems((p) => [{ id: `sync-${Date.now()}`, action: "Manual sync", when: new Date().toISOString() }, ...p].slice(0, 12));
    setLoadingSync(false);
  };

  // Mock hospitalId - get from user data or null
  const hospitalId = user?.id || null;
  
  // Mock data for hospitalist query
  const hospitalQuery = { data: user ? { is_verified: true } : null, isLoading: false };
  
  // Mock data for recent activity
  const recent = [
    { id: "1", description: "Recent activity 1", timestamp: new Date().toISOString() },
    { id: "2", description: "Recent activity 2", timestamp: new Date().toISOString() },
  ];

  // render children wrapped with hospitalId prop if they accept it
  const renderContent = () => {
    switch (currentPage) {
      case "overview":
        return <Overview />;
      case "emergencies":
        return <EmergencyRequests />;
      case "blood":
        return <BloodCoordination />;
      case "history":
        return <HistoryRecords />;
      case "notifications":
        return <Notifications />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="p-6">Header placeholder: Hospital Dashboard</div>

          <main className="p-6">
            {/* Top quick actions */}
            <div className="mb-4">
              {/* Quick Actions placeholder */}
            </div>

            {/* Main content area */}
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
            >
              {renderContent()}
            </motion.div>

            {/* Side widgets: Audit + Recent */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {/* nothing here — main content occupies left 2 cols */}
              </div>
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Tools</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={handleSync} className="flex items-center gap-2">
                        {loadingSync ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshIconFallback />} Sync
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("/hospital/profile")}>
                        Profile
                      </Button>
                    </div>
                  </div>

                  {/* Audit Trail placeholder */}
                  {/* Recent Activity placeholder */}
                </div>
              </div>
            </div>

            {/* Footer area with small KPIs */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="text-xs text-slate-500">Hospital ID</div>
                <div className="font-mono text-sm mt-2">{hospitalId ?? "not registered"}</div>
              </div>

              <div className="bg-white p-4 rounded shadow-sm">
                <div className="text-xs text-slate-500">User</div>
                <div className="text-sm mt-2">{user?.email ?? user?.id ?? "—"}</div>
              </div>

              <div className="bg-white p-4 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Support</div>
                    <div className="text-sm mt-1">Govt onboarding / NGO</div>
                  </div>
                  <div>
                    <Button size="sm" variant="ghost" onClick={() => navigate("/admin")}>
                      Admin
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* logout / small controls */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
              <Button variant="ghost" onClick={() => window.print()}>
                <PrinterFallbackIcon /> Print
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   Small icon fallbacks (kept inline to avoid extra imports)
   ------------------------- */
function RefreshIconFallback() {
  return <Loader2 className="w-4 h-4" />;
}
function PrinterFallbackIcon() {
  return <MapPin className="w-4 h-4" />;
}