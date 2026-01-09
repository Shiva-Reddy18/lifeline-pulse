// src/pages/hospital/HistoryRecords.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Search, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";

/**
 * HistoryRecords.tsx
 *
 * Purpose:
 * - Hospital-scoped historical view of emergencies, donor assignments and inventory changes.
 * - Filters, CSV export, summary stats, and demo-safe fallbacks if DB tables are missing.
 *
 * Key enforcement:
 * - hospitalId is derived from profile.id or profile.hospital_id (UUID). Do NOT use user.id for production logic.
 * - Mutation actions are intentionally not present here (history is read-only).
 *
 * Notes:
 * - This file uses react-query for fetching. It has sensible refetch times for demo.
 * - If relevant tables are absent in Supabase, the UI falls back to mocked sample records so the demo remains usable.
 */

/* -------------------------
   Types
   ------------------------- */

type UUID = string;

type EmergencyHistoryRow = {
  id: string;
  created_at: string | null;
  emergency_id?: string | null;
  blood_group?: string | null;
  units_required?: number | null;
  patient_name?: string | null;
  status?: string | null;
  hospital_action?: string | null;
  severity?: string | null;
  hospital_id?: UUID | null;
};

type DonorAssignmentRow = {
  id: string;
  donor_id?: string | null;
  donor_name?: string | null;
  emergency_id?: string | null;
  assigned_at?: string | null;
  hospital_id?: UUID | null;
};

type InventoryChangeRow = {
  id: string;
  hospital_id?: UUID | null;
  blood_group?: string | null;
  delta?: number | null;
  new_value?: number | null;
  changed_at?: string | null;
  reason?: string | null;
  actor?: string | null;
};

/* -------------------------
   Helpers & Mock Data
   ------------------------- */

const SAFE_DATE = (d?: string | null) => (d ? format(parseISO(d), "yyyy-MM-dd HH:mm") : "—");

const MOCK_EMERGENCIES: EmergencyHistoryRow[] = [
  {
    id: "h_demo_1",
    created_at: new Date().toISOString(),
    emergency_id: "EMERG-2026-001",
    blood_group: "O+",
    units_required: 2,
    patient_name: "John Doe",
    status: "COMPLETED",
    hospital_action: "Accepted & Delivered",
    severity: "STABLE",
  },
  {
    id: "h_demo_2",
    created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
    emergency_id: "EMERG-2026-002",
    blood_group: "A-",
    units_required: 1,
    patient_name: "Jane Smith",
    status: "COMPLETED",
    hospital_action: "Accepted & Delivered",
    severity: "URGENT",
  },
  {
    id: "h_demo_3",
    created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    emergency_id: "EMERG-2026-003",
    blood_group: "B+",
    units_required: 3,
    patient_name: "Michael Johnson",
    status: "CANCELLED",
    hospital_action: "Rerouted",
    severity: "CRITICAL",
  },
];

const MOCK_ASSIGNMENTS: DonorAssignmentRow[] = [
  { id: "a_demo_1", donor_id: "d_demo_1", donor_name: "Ravi Kumar", emergency_id: "EMERG-2026-001", assigned_at: new Date().toISOString() },
  { id: "a_demo_2", donor_id: "d_demo_2", donor_name: "Anita Sharma", emergency_id: "EMERG-2026-002", assigned_at: new Date(Date.now() - 3600 * 1000).toISOString() },
];

const MOCK_INVENTORY_CHANGES: InventoryChangeRow[] = [
  { id: "c_demo_1", blood_group: "O+", delta: -2, new_value: 8, changed_at: new Date().toISOString(), reason: "Used for EMERG-2026-001", actor: "Dr. Reddy" },
  { id: "c_demo_2", blood_group: "A-", delta: -1, new_value: 4, changed_at: new Date(Date.now() - 86400 * 1000).toISOString(), reason: "Used for EMERG-2026-002", actor: "Nurse" },
];

/* -------------------------
   Main component
   ------------------------- */

export default function HistoryRecords({ hospitalId: propHospitalId }: { hospitalId?: UUID }) {
  const { profile } = useAuth() as any;
  const { toast } = useToast();

  // derive hospitalId from profile if not passed in prop
  const hospitalId: UUID | undefined = propHospitalId ?? (profile?.id ?? (profile as any)?.hospital_id);

  // filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [loadingDownload, setLoadingDownload] = useState(false);

  /* -------------------------
     Fetch emergency history (hospital-scoped)
     ------------------------- */
  const fetchEmergencyHistory = useCallback(async (): Promise<EmergencyHistoryRow[]> => {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      // Attempt to read a canonical history view/table
      const q = supabase
        .from("emergency_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      // If hospitalId exists, scope
      if (hospitalId) q.eq("hospital_id", hospitalId);

      const { data, error } = await q;
      if (error) {
        // fallback to query emergencies table if history table absent
        console.warn("emergency_history fetch failed, trying emergencies table:", error.message || error);
        const fallback = supabase
          .from("emergency_requests")

          .select("id as id, created_at, id as emergency_id, blood_group, units_required, patient_name, status, hospital_action, severity, hospital_id")
          .order("created_at", { ascending: false })
          .limit(1000);
        if (hospitalId) fallback.eq("hospital_id", hospitalId);
        const { data: fb, error: fbErr } = await fallback;
        if (fbErr) throw fbErr;
        return (fb ?? []) as EmergencyHistoryRow[];
      }
      return (data ?? []) as EmergencyHistoryRow[];
    } catch (e) {
      console.warn("fetchEmergencyHistory fallback to mock", e);
      return MOCK_EMERGENCIES;
    }
  }, [hospitalId]);

  const emergenciesQuery = useQuery({
    queryKey: ["history", "emergencies", hospitalId],
    queryFn: fetchEmergencyHistory,
    refetchInterval: 15000,
    staleTime: 8000,
  });

  /* -------------------------
     Fetch donor assignments history
     ------------------------- */
  const fetchAssignments = useCallback(async (): Promise<DonorAssignmentRow[]> => {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const q = supabase.from("donor_assignments").select("*").order("assigned_at", { ascending: false }).limit(1000);
      if (hospitalId) q.eq("hospital_id", hospitalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DonorAssignmentRow[];
    } catch (e) {
      console.warn("fetchAssignments fallback", e);
      return MOCK_ASSIGNMENTS;
    }
  }, [hospitalId]);

  const assignmentsQuery = useQuery({
    queryKey: ["history", "assignments", hospitalId],
    queryFn: fetchAssignments,
    refetchInterval: 20000,
    staleTime: 12000,
  });

  /* -------------------------
     Fetch inventory changes
     ------------------------- */
  const fetchInventoryChanges = useCallback(async (): Promise<InventoryChangeRow[]> => {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const q = supabase.from("inventory_changes").select("*").order("changed_at", { ascending: false }).limit(1000);
      if (hospitalId) q.eq("hospital_id", hospitalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InventoryChangeRow[];
    } catch (e) {
      console.warn("fetchInventoryChanges fallback", e);
      return MOCK_INVENTORY_CHANGES;
    }
  }, [hospitalId]);

  const inventoryChangesQuery = useQuery({
    queryKey: ["history", "inventory_changes", hospitalId],
    queryFn: fetchInventoryChanges,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  /* -------------------------
     Derived & filtered lists
     ------------------------- */
  const emergencies = emergenciesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const inventoryChanges = inventoryChangesQuery.data ?? [];

  const applyFiltersToEmergencies = useCallback(
    (rows: EmergencyHistoryRow[]) => {
      return rows.filter((r) => {
        // hospital scope already applied during query
        // text search across emergency_id, patient_name, blood_group
        const q = searchTerm.trim().toLowerCase();
        if (q) {
          const matches =
            (String(r.emergency_id ?? "").toLowerCase().includes(q) ||
              String(r.patient_name ?? "").toLowerCase().includes(q) ||
              String(r.blood_group ?? "").toLowerCase().includes(q));
          if (!matches) return false;
        }

        if (filterStatus !== "all") {
          if ((r.status ?? "").toLowerCase() !== filterStatus.toLowerCase()) return false;
        }

        if (filterSeverity !== "all") {
          if ((r.severity ?? "").toLowerCase() !== filterSeverity.toLowerCase()) return false;
        }

        if (dateFrom) {
          const start = new Date(dateFrom);
          const created = r.created_at ? new Date(r.created_at) : null;
          if (!created || created < start) return false;
        }
        if (dateTo) {
          const end = new Date(dateTo);
          const created = r.created_at ? new Date(r.created_at) : null;
          if (!created || created > end) return false;
        }
        return true;
      });
    },
    [searchTerm, filterStatus, dateFrom, dateTo, filterSeverity]
  );

  const filteredEmergencies = useMemo(() => {
    const arr = applyFiltersToEmergencies(emergencies);
    const sorted = arr.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortBy === "date_asc" ? ta - tb : tb - ta;
    });
    return sorted;
  }, [emergencies, applyFiltersToEmergencies, sortBy]);

  /* -------------------------
     Summary stats
     ------------------------- */
  const totalEmergencies = emergencies.length;
  const completedCount = emergencies.filter((r) => (String(r.status || "").toLowerCase() === "completed")).length;
  const successRate = totalEmergencies > 0 ? Math.round((completedCount / totalEmergencies) * 100) : 0;
  const totalUnits = emergencies.reduce((s, r) => s + (Number(r.units_required || 0) || 0), 0);
  const avgUnits = totalEmergencies > 0 ? (totalUnits / totalEmergencies).toFixed(1) : "0.0";

  /* -------------------------
     CSV Export
     ------------------------- */
  const handleDownloadCSV = async () => {
    setLoadingDownload(true);
    try {
      const rows = filteredEmergencies.map((r) => ({
        "Date & Time": SAFE_DATE(r.created_at),
        "Emergency ID": r.emergency_id ?? r.id,
        Patient: r.patient_name ?? "—",
        "Blood Group": r.blood_group ?? "—",
        Units: r.units_required ?? 0,
        Severity: r.severity ?? "—",
        Status: r.status ?? "—",
        "Hospital Action": r.hospital_action ?? "—",
      }));

      const headers = Object.keys(rows[0] ?? {});
      const csv = [headers.join(",")]
        .concat(rows.map((row) => headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `history_emergencies_${hospitalId ?? "local"}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "CSV exported successfully." });
    } catch (e: any) {
      console.error("CSV export failed", e);
      toast({ title: "Failed", description: "Could not export CSV", variant: "destructive" } as any);
    } finally {
      setLoadingDownload(false);
    }
  };

  /* -------------------------
     UI helpers
     ------------------------- */
  const getStatusBadge = (status?: string | null) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "completed" || s === "fulfilled") return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (s === "in_progress" || s === "hospital_accepted" || s === "accepted") return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
    if (s === "cancelled") return <Badge className="bg-slate-100 text-slate-800">Cancelled</Badge>;
    return <Badge className="bg-slate-100 text-slate-800">{status ?? "Unknown"}</Badge>;
  };

  /* -------------------------
     Effects
     ------------------------- */
  useEffect(() => {
    // If user lacks hospitalId, inform them — non-blocking
    if (!hospitalId) {
      toast?.({ title: "Demo mode", description: "Hospital ID not detected. History shows demo data." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">History & Records</h2>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">Search</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Emergency ID / Patient / Blood group" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Severity</label>
              <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">From (ISO)</label>
              <Input placeholder="YYYY-MM-DD" value={dateFrom ?? ""} onChange={(e) => setDateFrom(e.target.value || null)} className="mt-2" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">To (ISO)</label>
              <Input placeholder="YYYY-MM-DD" value={dateTo ?? ""} onChange={(e) => setDateTo(e.target.value || null)} className="mt-2" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Sort</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterSeverity("all"); setDateFrom(null); setDateTo(null); }}>
              Reset
            </Button>
            <Button onClick={handleDownloadCSV} className="gap-2" disabled={loadingDownload}>
              <Download className="w-4 h-4" /> {loadingDownload ? "Exporting..." : "Download CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Handling Records ({filteredEmergencies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Emergency ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Blood Group</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Units</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Severity</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Hospital Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmergencies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">No records found</td>
                  </tr>
                ) : (
                  filteredEmergencies.map((rec, idx) => (
                    <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="font-mono text-xs">{SAFE_DATE(rec.created_at)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{rec.emergency_id ?? rec.id}</code></td>
                      <td className="py-3 px-4">{rec.patient_name ?? "—"}</td>
                      <td className="py-3 px-4"><span className="font-semibold text-red-600">{rec.blood_group ?? "—"}</span></td>
                      <td className="py-3 px-4"><Badge className="bg-slate-100 text-slate-800">{rec.units_required ?? 0}</Badge></td>
                      <td className="py-3 px-4">{(rec.severity ?? "—").toUpperCase()}</td>
                      <td className="py-3 px-4 text-sm">{rec.hospital_action ?? "—"}</td>
                      <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Inventory Change Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Donor Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(assignments.length === 0 ? MOCK_ASSIGNMENTS : assignments).slice(0, 10).map((a) => (
                <div key={a.id} className="p-3 border rounded bg-white flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.donor_name ?? a.donor_id}</div>
                    <div className="text-xs text-slate-500">Assigned to: {a.emergency_id ?? "—"}</div>
                  </div>
                  <div className="text-xs text-slate-400">{SAFE_DATE(a.assigned_at)}</div>
                </div>
              ))}
              {assignments.length === 0 && <div className="text-sm text-slate-400">No assignments recorded</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(inventoryChanges.length === 0 ? MOCK_INVENTORY_CHANGES : inventoryChanges).slice(0, 10).map((c) => (
                <div key={c.id} className="p-3 border rounded bg-white flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{c.blood_group ?? "—"} <span className="text-xs text-slate-400">({c.actor ?? "system"})</span></div>
                    <div className="text-xs text-slate-500">{c.reason ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{c.delta ?? 0 > 0 ? `+${c.delta}` : c.delta}</div>
                    <div className="text-xs text-slate-400">{SAFE_DATE(c.changed_at)}</div>
                  </div>
                </div>
              ))}
              {inventoryChanges.length === 0 && <div className="text-sm text-slate-400">No inventory changes recorded</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Total Emergencies</p>
            <p className="text-3xl font-bold mt-2">{totalEmergencies}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Success Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{successRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Total Blood Units</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{totalUnits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Avg Units / Emergency</p>
            <p className="text-3xl font-bold mt-2">{avgUnits}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------
   Small helper for status badge (kept after export so TS knows it's available)
   ------------------------- */
function getStatusBadge(status?: string | null) {
  const s = String(status ?? "").toLowerCase();
  if (s === "completed" || s === "fulfilled") return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
  if (s === "in_progress" || s === "hospital_accepted" || s === "accepted") return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
  if (s === "cancelled") return <Badge className="bg-slate-100 text-slate-800">Cancelled</Badge>;
  return <Badge className="bg-slate-100 text-slate-800">{status ?? "Unknown"}</Badge>;
}
