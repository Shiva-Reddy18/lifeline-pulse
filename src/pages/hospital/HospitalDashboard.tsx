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

type UUID = string | undefined;

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

// Demo flag: set true while developing so actions are allowed even without strict verified hospital
const DEMO_ALLOW_ACTIONS = true;

/* -------------------------
   Sidebar component
   ------------------------- */
function Sidebar({
  open,
  setOpen,
  currentPage,
  onNavigate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  currentPage: string;
  onNavigate: (path: string) => void;
}) {
  const menuItems = [
    { icon: BarChart3, label: "Overview", id: "overview", path: "/hospital/overview" },
    { icon: AlertTriangle, label: "Emergency Requests", id: "emergencies", path: "/hospital/emergencies" },
    { icon: Droplet, label: "Blood Coordination", id: "blood", path: "/hospital/blood" },
    { icon: FileText, label: "History & Records", id: "history", path: "/hospital/history" },
    { icon: Clock, label: "Notifications", id: "notifications", path: "/hospital/notifications" },
    { icon: Settings, label: "Profile & Settings", id: "profile", path: "/hospital/profile" },
  ];

  return (
    <aside
      className={`${open ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 fixed h-screen left-0 top-0 z-40 overflow-y-auto`}
    >
      <div className="p-6 flex items-center justify-between">
        <motion.div
          initial={false}
          animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-2 overflow-hidden"
        >
          <Heart className="w-8 h-8 text-red-500 flex-shrink-0" />
          {open && <span className="font-bold text-lg">LIFELINE</span>}
        </motion.div>

        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="text-white hover:bg-slate-800">
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      <nav className="mt-6 px-3">
        {menuItems.map(({ icon: Icon, label, id, path }) => {
          const active = currentPage === id;
          return (
            <motion.button
              key={id}
              whileHover={{ paddingLeft: 24 }}
              onClick={() => onNavigate(path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                active ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {open && <span>{label}</span>}
            </motion.button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-0 right-0 px-3">
        <div className="h-12" />
      </div>
    </aside>
  );
}

/* -------------------------
   Header / top controls
   ------------------------- */
function Header({
  hospitalName,
  verified,
  onOpenNotifications,
  onQuickSearch,
}: {
  hospitalName: string;
  verified?: boolean | null;
  onOpenNotifications: () => void;
  onQuickSearch: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      if (q && q.length >= 2) onQuickSearch(q);
    }, 350);
    return () => clearTimeout(t);
  }, [q, onQuickSearch]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{hospitalName}</h1>
          <p className="text-sm text-slate-500 mt-1">Hospital Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              aria-label="Search"
              placeholder="Search donors, emergencies, inventory..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border rounded px-3 py-2 w-72 text-sm outline-none"
            />
            <Search className="absolute right-2 top-2 w-4 h-4 text-slate-400" />
          </div>

          <Badge className={`${verified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {verified ? "✓ Verified" : "Unverified"}
          </Badge>

          <Button variant="ghost" size="sm" onClick={onOpenNotifications} className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------
   Quick Actions bar
   ------------------------- */
function QuickActions({ hospitalId, onNavigate }: { hospitalId?: UUID; onNavigate: (p: string) => void }) {
  // allow quick actions when DEMO_ALLOW_ACTIONS is true OR hospitalId exists
  const canCreateEmergency = DEMO_ALLOW_ACTIONS || Boolean(hospitalId);

  return (
    <div className="bg-white p-4 rounded shadow-sm flex items-center gap-3">
      <div className="flex-1">
        <div className="text-sm text-slate-500">Quick actions</div>
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={() => onNavigate("/hospital/blood")} className="flex items-center gap-2">
            <Droplet className="w-4 h-4" /> Manage Inventory
          </Button>

          <Button onClick={() => onNavigate("/hospital/emergencies")} variant="outline" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> View Emergencies
          </Button>

          <Button disabled={!canCreateEmergency} onClick={() => onNavigate("/hospital/emergencies")} variant="destructive" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Emergency
          </Button>

          {!hospitalId && DEMO_ALLOW_ACTIONS && (
            <div className="text-xs text-slate-400 ml-2">
              (Demo mode: hospital not registered — actions allowed for testing)
            </div>
          )}
        </div>
      </div>

      <div className="w-56 text-right">
        <div className="text-xs text-slate-500">Last sync</div>
        <div className="text-sm font-medium mt-1">Just now</div>
      </div>
    </div>
  );
}

/* -------------------------
   Audit Trail (small)
   ------------------------- */
function AuditTrail({ items }: { items?: { id: string; action: string; when?: string }[] }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">Audit Trail</div>
        <div className="text-xs text-slate-400">Last 10 events</div>
      </div>

      <div className="mt-3 space-y-2">
        {(items && items.length ? items : [{ id: "a1", action: "No recent events", when: undefined }]).map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm">
            <div className="text-slate-700">{it.action}</div>
            <div className="text-xs text-slate-400">{fmtDate(it.when)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------
   Recent Activity (placeholder)
   ------------------------- */
function RecentActivity({ items }: { items?: { id: string; title: string; when?: string; meta?: string }[] }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">Recent Activity</div>
        <div className="text-xs text-slate-400">Last events</div>
      </div>

      <div className="mt-3 space-y-2">
        {(items && items.length ? items : [{ id: "r1", title: "No activity", when: undefined }]).map((it) => (
          <div key={it.id} className="flex items-start gap-3">
            <div>
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-slate-400 mt-1">{it.meta}</div>
            </div>
            <div className="ml-auto text-xs text-slate-400">{fmtDate(it.when)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------
   Main exported component
   ------------------------- */
export default function HospitalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, logout } = useAuth() as any;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // prefer profile-derived hospital id (if present)
  const profileHospitalId =
    profile && ((profile as any).id ?? (profile as any).hospital_id) ? ((profile as any).id ?? (profile as any).hospital_id) : null;

  // ACTIVE HOSPITAL RESOLUTION
  const hospitalQuery = useQuery(
    ["active-hospital-dashboard", profileHospitalId],
    async () => {
      // if profile gives hospital id, fetch that record exactly (preferred)
      if (profileHospitalId) {
        const { data, error } = await supabase
          .from("hospitals")
          .select("id, name, address, city, contact_phone, email, location_lat, location_lng, is_verified")
          .eq("id", profileHospitalId)
          .limit(1)
          .single();
        if (error) throw error;
        return data as { id: string; name?: string; is_verified?: boolean } | null;
      }

      // FALLBACK: return *any* hospital row (do NOT require is_verified here)
      // This avoids blocking UI if your hospital isn't flagged verified in DB during dev
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name, address, city, contact_phone, email, location_lat, location_lng, is_verified")
        .limit(1)
        .single();

      if (error) {
        console.warn("No hospital fallback found (db):", error?.message ?? error);
        return null;
      }
      return data as { id: string; name?: string; is_verified?: boolean } | null;
    },
    { staleTime: 60_000, enabled: true }
  );

  // compute hospitalId from profile OR fallback to DB record
  const hospitalId: UUID = (profileHospitalId as UUID) ?? (hospitalQuery.data ? (hospitalQuery.data as any).id : undefined);

  // display name: prefer DB hospital name, else fallback to profile values
  const hospitalName = (hospitalQuery.data && (hospitalQuery.data as any).name) ?? (profile?.hospital_name ?? profile?.full_name ?? "Hospital");

  const currentPage = location.pathname.split("/hospital/").pop() || "overview";

  const [auditItems, setAuditItems] = useState<{ id: string; action: string; when?: string }[]>([]);
  const [recent, setRecent] = useState<{ id: string; title: string; when?: string; meta?: string }[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);

  useEffect(() => {
    const base = [
      { id: "evt-login", action: "Dashboard opened", when: new Date().toISOString() },
      ...(profile?.hospital_name ? [{ id: "evt-profile", action: `Hospital: ${profile.hospital_name}`, when: new Date().toISOString() }] : []),
    ];
    setAuditItems(base);
    setRecent([{ id: "rc-1", title: "No significant activity yet", when: new Date().toISOString() }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (profile && (profile as any).role && (profile as any).role !== "hospital") {
      console.warn("User does not appear to be a hospital account. Profile role:", (profile as any).role);
    }
  }, [profile]);

  const doLogout = useCallback(async () => {
    const f = signOut ?? logout;
    try {
      if (f) await f();
    } catch (e) {
      console.warn("Logout failed", e);
    }
    navigate("/");
  }, [signOut, logout, navigate]);

  const handleNavigate = (path: string) => navigate(path);
  const openNotifications = () => navigate("/hospital/notifications");

  const handleQuickSearch = (q: string) => {
    if (!q) return;
    if (q.match(/A|B|O|AB/gi)) {
      navigate("/hospital/blood");
    } else {
      navigate("/hospital/emergencies");
    }
  };

  const handleSync = async () => {
    setLoadingSync(true);
    await new Promise((r) => setTimeout(r, 700));
    setAuditItems((p) => [{ id: `sync-${Date.now()}`, action: "Manual sync", when: new Date().toISOString() }, ...p].slice(0, 12));
    setLoadingSync(false);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "overview":
        return <Overview />;
      case "emergencies":
        return <EmergencyRequests hospitalId={hospitalId} />;
      case "blood":
        return <BloodCoordination hospitalId={hospitalId} />;
      case "history":
        return <HistoryRecords hospitalId={hospitalId} />;
      case "notifications":
        return <Notifications hospitalId={hospitalId} />;
      case "profile":
        return <ProfileSettings hospitalId={hospitalId} />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} currentPage={currentPage} onNavigate={handleNavigate} />

      <div className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Header
            hospitalName={hospitalName}
            verified={Boolean(hospitalQuery.data ? (hospitalQuery.data as any).is_verified : (profile as any)?.verified)}
            onOpenNotifications={openNotifications}
            onQuickSearch={handleQuickSearch}
          />

          <main className="p-6">
            <div className="mb-4">
              <QuickActions hospitalId={hospitalId} onNavigate={handleNavigate} />
            </div>

            <motion.div key={currentPage} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
              {renderContent()}
            </motion.div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2" />
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

                  <AuditTrail items={auditItems} />
                  <RecentActivity items={recent} />
                </div>
              </div>
            </div>

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

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button onClick={doLogout} variant="destructive" className="flex items-center gap-2">
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

/* small icon fallbacks */
function RefreshIconFallback() {
  return <Loader2 className="w-4 h-4" />;
}
function PrinterFallbackIcon() {
  return <MapPin className="w-4 h-4" />;
}
