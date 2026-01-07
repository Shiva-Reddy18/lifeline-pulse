// src/pages/hospital/HospitalDashboard.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Heart,
  Menu,
  LogOut,
  BarChart3,
  AlertTriangle,
  Droplet,
  Navigation,
  FileText,
  Settings,
  Clock,
  X,
} from "lucide-react";

// Import all page components
import Overview from "./Overview";
import EmergencyRequests from "./EmergencyRequests";
import BloodCoordination from "./BloodCoordination";
import LiveTracking from "./LiveTracking";
import HistoryRecords from "./HistoryRecords";
import Notifications from "./Notifications";
import ProfileSettings from "./ProfileSettings";

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hospitalName = profile?.full_name ?? profile?.hospital_name ?? "Hospital";

  // Extract the current page from the URL
  const currentPage = location.pathname.split("/hospital/").pop() || "overview";

  const menuItems = [
    { icon: BarChart3, label: "Overview", id: "overview", path: "/hospital/overview" },
    { icon: AlertTriangle, label: "Emergency Requests", id: "emergencies", path: "/hospital/emergencies" },
    { icon: Droplet, label: "Blood Coordination", id: "blood", path: "/hospital/blood" },
    { icon: Navigation, label: "Live Case Tracking", id: "live", path: "/hospital/live" },
    { icon: FileText, label: "History & Records", id: "history", path: "/hospital/history" },
    { icon: Clock, label: "Notifications", id: "notifications", path: "/hospital/notifications" },
    { icon: Settings, label: "Profile & Settings", id: "profile", path: "/hospital/profile" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "overview":
        return <Overview />;
      case "emergencies":
        return <EmergencyRequests />;
      case "blood":
        return <BloodCoordination />;
      case "live":
        return <LiveTracking />;
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
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 fixed h-screen left-0 top-0 z-40 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <motion.div
            initial={false}
            animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <Heart className="w-8 h-8 text-red-500 flex-shrink-0" />
            {sidebarOpen && <span className="font-bold text-lg">LIFELINE</span>}
          </motion.div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-slate-800"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 space-y-2 px-3">
          {menuItems.map(({ icon: Icon, label, id, path }) => (
            <motion.button
              key={id}
              whileHover={{ paddingLeft: 24 }}
              onClick={() => handleNavigation(path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                currentPage === id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-0 right-0 px-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 sticky top-0 z-30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{hospitalName}</h1>
                <p className="text-sm text-slate-500 mt-1">Hospital Dashboard</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation("/hospital/notifications")}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
                </Button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
