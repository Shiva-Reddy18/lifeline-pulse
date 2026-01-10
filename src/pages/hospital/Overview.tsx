// src/pages/hospital/Overview.tsx
import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Activity,
  Users,
  Droplet,
  TrendingUp,
  Clock,
  PlusCircle,
  RefreshCw,
  Layers,
  Eye,
  Zap,
} from "lucide-react";

/**
 * Types
 */
type UUID = string;

type HospitalProfile = {
  id: UUID;
  hospital_name?: string;
  full_name?: string;
  verified?: boolean;
  location?: { lat: number; lng: number; address?: string } | null;
  license_number?: string;
};

type InventoryRow = {
  id: UUID;
  hospital_id: UUID;
  blood_group: string;
  units_available: number;
  min_threshold: number;
  updated_at?: string | null;
};

type EmergencyRow = {
  id: UUID;
  hospital_id: UUID;
  blood_group: string;
  units_required: number;
  severity: "STABLE" | "URGENT" | "CRITICAL";
  status: "CREATED" | "HOSPITAL_ACCEPTED" | "DISPATCHED" | "FULFILLED" | "CANCELLED";
  notes?: string | null;
  created_at?: string | null;
};

type DonorRow = {
  id: UUID;
  name?: string;
  last_active_at?: string | null;
};

/**
 * Helpers
 */
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");
const sum = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) : 0);
const clamp = (n: number, min = 0) => Math.max(min, Math.floor(n || 0));

/**
 * STAT CARD component
 */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
  colorClass = "bg-slate-50",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  onClick?: () => void;
  colorClass?: string;
}) {
  const Icon = icon;
  return (
    <motion.div whileHover={{ y: -4 }} className="cursor-default">
      <Card onClick={onClick}>
        <CardContent className="pt-4 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
              <div className="mt-2">
                <div className="text-3xl font-bold">{value}</div>
                {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
              <Icon className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Loading skeleton (simple)
 */
function LoadingBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-6 bg-slate-100 rounded" />
      ))}
    </div>
  );
}

/**
 * Main Overview Page
 */
export default function Overview() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  /**
   * HACKATHON: get an active hospital from DB if profile doesn't map directly.
   * We preserve your original intent (try profile-based hospital id), but fall back to the first verified hospital in DB.
   *
   * Priority:
   * 1) profile.id or profile.hospital_id (if your auth/profile is wired to hospitals)
   * 2) first verified hospital from hospitals table (hackathon mode)
   */

  // fetch active hospital (first verified) so UI works in hackathon mode
  const hospitalQuery = useQuery(
    ["active-hospital"],
    async () => {
      const { data, error } = await supabase
        .from("hospitals")
        // select real columns present in your schema
        .select("id,name,address,city,contact_phone,email,location_lat,location_lng,is_verified")
        .eq("is_verified", true)
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    { staleTime: 60_000 }
  );

  // preserve original profile-based logic but fallback to hospitalQuery
  const profileHospitalId =
    profile && ((profile as any).id ?? (profile as any).hospital_id)
      ? ((profile as any).id ?? (profile as any).hospital_id)
      : null;

  const hospitalId: UUID | null = (profileHospitalId as UUID) ?? (hospitalQuery.data ? (hospitalQuery.data as any).id : null);

  /**
   * ---------- Queries ----------
   *
   * We scope queries to the hospitalId when available to ensure hospital-only data.
   * Each query has sensible refetch intervals for demo stability.
   */

  // Inventory rows for this hospital
  const inventoryQuery = useQuery(
    ["hospital", hospitalId, "inventory"],
    async () => {
      if (!hospitalId) return [];
      const { data, error } = await supabase
        .from<InventoryRow>("blood_inventory")
        .select("*")
        .eq("hospital_id", hospitalId)
        .order("blood_group", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InventoryRow[];
    },
    { enabled: !!hospitalId, refetchInterval: 10_000, staleTime: 8_000 }
  );

  // Emergencies for this hospital
  const emergenciesQuery = useQuery(
    ["hospital", hospitalId, "emergencies"],
    async () => {
      if (!hospitalId) return [];
      const { data, error } = await supabase
        // correct table name: emergency_requests
        .from<EmergencyRow>("emergency_requests")
        .select("*")
        .eq("hospital_id", hospitalId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as EmergencyRow[];
    },
    { enabled: !!hospitalId, refetchInterval: 8_000, staleTime: 6_000 }
  );

  // Donors count (global) — you can scope by region later
  const donorsCountQuery = useQuery(
    ["donors", "count"],
    async () => {
      const { count, error } = await supabase.from<DonorRow>("donors").select("id", { count: "exact" });
      if (error) throw error;
      return count ?? 0;
    },
    { refetchInterval: 60_000, staleTime: 30_000 }
  );

  // Hospital record fetch (to get accurate metadata if profile lacks it)
  const hospitalRecordQuery = useQuery(
    ["hospitals", hospitalId, "meta"],
    async () => {
      if (!hospitalId) return null;
      const { data, error } = await supabase
        .from("hospitals")
        // select real columns present in your schema; we'll map below to your HospitalProfile shape
        .select("id,name,address,city,contact_phone,email,location_lat,location_lng,is_verified")
        .eq("id", hospitalId)
        .single();
      if (error) throw error;
      return data;
    },
    { enabled: !!hospitalId, refetchInterval: 60_000 }
  );

  // Derived data
  const inventory = inventoryQuery.data ?? [];
  const emergencies = emergenciesQuery.data ?? [];
  const donorsCount = donorsCountQuery.data ?? 0;

  // Map the DB hospital record into your original HospitalProfile shape so the rest of the JSX can remain unchanged.
  const rawHospital = hospitalRecordQuery.data ?? (hospitalQuery.data ?? null);

  const hospitalRecord: HospitalProfile | null =
    rawHospital
      ? {
          id: (rawHospital as any).id,
          hospital_name: (rawHospital as any).name ?? (rawHospital as any).full_name ?? undefined,
          full_name: (rawHospital as any).name ?? undefined,
          verified: (rawHospital as any).is_verified ?? undefined,
          location:
            (rawHospital as any).location_lat || (rawHospital as any).location_lng || (rawHospital as any).address
              ? {
                  lat: (rawHospital as any).location_lat ?? 0,
                  lng: (rawHospital as any).location_lng ?? 0,
                  address: (rawHospital as any).address ?? undefined,
                }
              : null,
          license_number: undefined,
        }
      : (profile as HospitalProfile | null);

  // compute aggregates
  const totalUnitsAvailable = useMemo(
    () => sum(inventory.map((r) => Number(r.units_available || 0))),
    [inventory]
  );
  const lowStockRows = useMemo(
    () => inventory.filter((r) => Number(r.units_available || 0) < Number(r.min_threshold || 0)),
    [inventory]
  );
  const activeEmergencies = useMemo(
    () => emergencies.filter((e) => e.status === "CREATED" || e.status === "HOSPITAL_ACCEPTED"),
    [emergencies]
  );

  useEffect(() => {
    // If we lack a hospitalId but the user is authenticated, try to navigate to profile to confirm registration
    if (!hospitalId && user) {
      // Don't be aggressive — only suggest
      console.warn("Hospital ID missing for user - ensure hospital registration completed");
    }
  }, [hospitalId, user]);

  /**
   * Action handlers
   */
  const goToEmergencies = () => navigate("/hospital/emergencies");
  const goToBlood = () => navigate("/hospital/blood");
  const goToHistory = () => navigate("/hospital/history");

  const handleRefreshAll = async () => {
    await Promise.all([
      inventoryQuery.refetch(),
      emergenciesQuery.refetch(),
      donorsCountQuery.refetch(),
      hospitalRecordQuery.refetch(),
      hospitalQuery.refetch(),
    ]);
  };

  /**
   * Render helpers: breakdown by blood group (simple table)
   */
  function BloodGroupBreakdown() {
    if (inventoryQuery.isLoading) return <LoadingBlock lines={6} />;
    if (!inventory.length)
      return (
        <Card>
          <CardContent>
            <div className="text-sm text-slate-500">No inventory rows found. Please add blood groups in the inventory tab.</div>
          </CardContent>
        </Card>
      );

    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Blood Group Breakdown</h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-800">{inventory.length} groups</Badge>
              <button onClick={goToBlood} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Manage
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Group</th>
                  <th className="py-2">Available</th>
                  <th className="py-2">Threshold</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((r) => {
                  const low = Number(r.units_available) < Number(r.min_threshold);
                  return (
                    <tr key={r.id} className={`${low ? "bg-amber-50" : ""}`}>
                      <td className="py-2 font-medium">{r.blood_group}</td>
                      <td className="py-2">{r.units_available}</td>
                      <td className="py-2">{r.min_threshold}</td>
                      <td className="py-2">
                        {low ? <Badge className="bg-amber-100 text-amber-800">Low</Badge> : <Badge className="bg-green-100 text-green-800">OK</Badge>}
                      </td>
                      <td className="py-2 text-xs text-slate-400">{fmt((r as any).updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Low-stock panel (actionable)
   */
  function LowStockPanel() {
    if (!lowStockRows.length) {
      return (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Low Stock</div>
                <div className="text-xs text-slate-500 mt-1">All groups are above their thresholds.</div>
              </div>
              <div className="text-sm text-slate-500">—</div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-medium">Low Stock — Immediate Attention</div>
              <div className="text-xs text-slate-500 mt-1">These groups are below their minimum threshold and can raise emergencies.</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800">{lowStockRows.length} groups</Badge>
              <button onClick={goToEmergencies} className="text-sm bg-red-50 px-2 py-1 rounded text-red-700">
                Create Emergency
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y">
            {lowStockRows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.blood_group}</div>
                  <div className="text-xs text-slate-400">Available: {r.units_available} • Threshold: {r.min_threshold}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/hospital/emergencies?group=${encodeURIComponent(r.blood_group)}`)}
                    className="text-sm bg-amber-50 px-2 py-1 rounded text-amber-800"
                  >
                    Draft Emergency
                  </button>
                  <button onClick={goToBlood} className="text-sm bg-slate-50 px-2 py-1 rounded text-slate-700">
                    Adjust Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Recent emergencies feed
   */
  function RecentEmergencies() {
    if (emergenciesQuery.isLoading) return <LoadingBlock lines={3} />;

    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium">Recent Emergencies</div>
              <div className="text-xs text-slate-500 mt-1">Most recent events (open / accepted / dispatched)</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => emergenciesQuery.refetch()} className="text-sm flex items-center gap-2 px-2 py-1 rounded bg-slate-50">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <Badge className="bg-blue-100 text-blue-800">{activeEmergencies.length} open</Badge>
            </div>
          </div>

          <div className="mt-4 divide-y">
            {emergencies.slice(0, 8).map((e) => (
              <div key={e.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">{e.severity}</Badge>
                    <div className="font-medium">{e.blood_group}</div>
                    <div className="text-xs text-slate-400">× {e.units_required}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{e.notes ?? "No notes"}</div>
                  <div className="text-xs text-slate-400 mt-1">Created: {fmt(e.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{e.status}</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <button onClick={() => navigate(`/hospital/emergencies/${e.id}`)} className="text-sm px-2 py-1 rounded bg-slate-50">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {emergencies.length === 0 && <div className="py-4 text-center text-slate-400">No emergencies recorded</div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Donor summary
   */
  function DonorSummary() {
    if (donorsCountQuery.isFetching) return <LoadingBlock lines={2} />;
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Registered Donors (global)</div>
              <div className="text-lg font-semibold mt-2">{donorsCount}</div>
              <div className="text-xs text-slate-400 mt-1">Active network for requests</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render main layout
   */
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            {hospitalRecord?.hospital_name ?? hospitalRecord?.full_name ?? "Hospital"} — {hospitalRecord?.license_number ?? "Unregistered"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefreshAll} className="flex items-center gap-2 px-3 py-2 rounded bg-slate-50 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Badge className={`${hospitalRecord?.verified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {hospitalRecord?.verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Requests" value={emergencies.filter((e) => e.status === "CREATED").length} subtitle="Not yet accepted" icon={AlertTriangle} onClick={goToEmergencies} colorClass="bg-amber-50" />
        <StatCard title="Active Cases" value={activeEmergencies.length} subtitle="Accepted by hospital" icon={Activity} colorClass="bg-red-50" />
        <StatCard title="Registered Donors" value={donorsCount} subtitle="Network size" icon={Users} colorClass="bg-blue-50" />
        <StatCard title="Available Units" value={totalUnitsAvailable} subtitle="Across all groups" icon={Droplet} colorClass="bg-green-50" />
      </div>

      {/* Upper quick panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Emergency Response (demo)</div>
                      <div className="text-xs text-slate-500 mt-1">Key response KPIs</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">12 min</div>
                      <div className="text-xs text-slate-400">avg</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded">
                      <div className="text-xs text-slate-500">24h Acceptance</div>
                      <div className="text-lg font-semibold mt-1">94%</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-slate-500">Match Success</div>
                      <div className="text-lg font-semibold mt-1">98%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DonorSummary />
          </div>

          {/* Blood group breakdown */}
          <div className="mt-4">
            <BloodGroupBreakdown />
          </div>
        </div>

        {/* right-side column */}
        <div className="space-y-4">
          <LowStockPanel />
          <RecentEmergencies />
        </div>
      </div>

      {/* Footer / history preview */}
      <div>
        <h3 className="text-lg font-medium mb-3">Activity & History</h3>
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Inventory rows</div>
                <div className="text-lg font-semibold mt-2">{inventory.length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Open emergencies</div>
                <div className="text-lg font-semibold mt-2">{activeEmergencies.length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Last updated</div>
                <div className="text-sm text-slate-600 mt-1">{inventory.length ? fmt((inventory[0] as any)?.updated_at) : "—"}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Full history can be viewed at the{" "}
              <button onClick={goToHistory} className="text-blue-600 underline">
                History & Records
              </button>{" "}
              page.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
