// src/pages/hospital/EmergencyRequests.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LiveMap from "@/components/LiveMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Phone,
  MapPin,
  Check,
  X,
  AlertTriangle,
  Droplet,
  RefreshCw,
  Search,
  Filter,
  ArrowLeftRight,
  Loader2,
  Trash2,
} from "lucide-react";
import type { EmergencyRequest as EmergencyRequestType } from "@/types/emergency";

/**
 * EmergencyRequests.tsx
 *
 * Hospital-only enforcement notes:
 * - The UI shows incoming emergencies, but all create/accept actions require a hospital identity (hospitalId).
 * - Hospital identity is taken from `profile.id` (or `profile.hospital_id`) provided by AuthContext.
 * - If hospitalId is absent, actions that mutate data are disabled and a clear message appears.
 *
 * This file intentionally:
 * - Accepts an optional hospitalId prop (so parent can pass it). If absent, we derive from profile.
 * - Uses robust queries with polling for demo stability.
 * - Performs optimistic updates and invalidation via react-query.
 * - Has strong fallbacks so the demo won't crash if supabase isn't configured.
 */

/* -------------------------
   Types & constants
   ------------------------- */

type UUID = string;

type EmergencyLocal = EmergencyRequestType & {
  // ensure we have consistent fields for safe UI usage
  id: string;
  blood_group: string;
  units_required: number;
  severity: "STABLE" | "URGENT" | "CRITICAL" | string;
  status: string;
  patient_name?: string | null;
  patient_phone?: string | null;
  address?: string | null;
  created_at?: string | null;
  // potential location fields used by older / different schemas:
  latitude?: number | null;
  longitude?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
  hospital_id?: UUID | null;
  hospital_name?: string | null;
  estimatedTime?: number | null;
};

const POLL_INTERVAL_MS = 6000; // 6s poll for demo

/* -------------------------
   Helpers
   ------------------------- */

const safeFmt = (d?: string | null) => (d ? formatDistanceToNowStrict(new Date(d), { addSuffix: true }) : "-");

const extractLatLng = (r: EmergencyLocal) => {
  const lat = r.latitude ?? r.location_lat ?? (r as any).lat ?? 0;
  const lng = r.longitude ?? r.location_lng ?? (r as any).lng ?? 0;
  return { lat: Number(lat) || 0, lng: Number(lng) || 0 };
};

/* -------------------------
   Mock fallback data (keeps UI working if Supabase is unreachable)
   ------------------------- */

const FALLBACK_EMERGENCIES: EmergencyLocal[] = [
  {
    id: "demo-1",
    blood_group: "B+",
    units_required: 2,
    severity: "URGENT",
    status: "created",
    patient_name: "Demo Patient",
    patient_phone: null,
    address: "Demo Hospital Area",
    created_at: new Date().toISOString(),
    latitude: null,
    longitude: null,
    hospital_id: null,
    hospital_name: null,
  },
];

/* -------------------------
   Main component
   ------------------------- */

export default function EmergencyRequests({ hospitalId: propHospitalId }: { hospitalId?: UUID }) {
  const { profile, user } = useAuth() as any;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // prefer explicit prop hospitalId (provided by parent Dashboard); otherwise derive from profile
  const derivedHospitalId: UUID | undefined = propHospitalId ?? (profile?.id ?? (profile as any)?.hospital_id);

  // role hint — optional, used to disable actions for non-hospitals
  const userRole = (profile as any)?.role ?? (profile as any)?.account_type ?? null;
  const isHospitalAccount = userRole ? String(userRole).toLowerCase() === "hospital" : !!derivedHospitalId;

  // local UI state
  const [selected, setSelected] = useState<EmergencyLocal | null>(null);
  const [queryText, setQueryText] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "CRITICAL" | "URGENT" | "STABLE">("ALL");
  const [onlyRecent, setOnlyRecent] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [hospitalNote, setHospitalNote] = useState<string>("");

  /* -------------------------
     Fetch emergencies (scoped to hospital feed if you want)
     ------------------------- */
  const fetchEmergencies = useCallback(async (): Promise<EmergencyLocal[]> => {
    try {
      if (!supabase) throw new Error("Supabase client not available");
      // The query intentionally fetches 'created' emergencies that are not handled yet.
      // In your design only hospitals create emergencies; they appear here for donors/volunteers/hospitals
      const { data, error } = await supabase
        .from("emergency_requests")
        .select("*")
        // we fetch open items; adjust status keys to your schema
        .in("status", ["CREATED", "created", "open", "OPEN"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EmergencyLocal[];
    } catch (e) {
      console.warn("fetchEmergencies failed, returning fallback", e);
      return FALLBACK_EMERGENCIES;
    }
  }, []);

  const emergenciesQuery = useQuery({
    queryKey: ["emergencies", "open"],
    queryFn: fetchEmergencies,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 4000,
  });

  /* -------------------------
     Derived UI subsets (filters, search)
     ------------------------- */
  const emergenciesRaw = emergenciesQuery.data ?? [];

  const filteredEmergencies = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = emergenciesRaw.filter((r) => {
      if (severityFilter !== "ALL" && String(r.severity).toUpperCase() !== severityFilter) return false;
      if (onlyRecent) {
        // last 48 hours
        if (r.created_at) {
          const ageMs = Date.now() - new Date(r.created_at).getTime();
          if (ageMs > 48 * 60 * 60 * 1000) return false;
        }
      }
      if (!q) return true;
      // search across patient name, address, blood group
      return (
        String(r.patient_name ?? "").toLowerCase().includes(q) ||
        String(r.address ?? "").toLowerCase().includes(q) ||
        String(r.blood_group ?? "").toLowerCase().includes(q)
      );
    });
    return list;
  }, [emergenciesRaw, queryText, severityFilter, onlyRecent]);

  /* -------------------------
     Accept mutation
     - Hospital must be present to accept
     - Accept sets status and attaches hospital info (hospital_id, hospital_name)
     - We include ETA and hospital_note fields if provided
     ------------------------- */
  const acceptMutation = useMutation(
    async (payload: {
      id: string;
      hospital_id?: UUID;
      hospital_name?: string | null;
      eta_minutes?: number | null;
      note?: string | null;
    }) => {
      if (!supabase) throw new Error("Supabase client not available");
      const updates: any = {
        status: "HOSPITAL_ACCEPTED",
        hospital_id: payload.hospital_id ?? null,
        hospital_name: payload.hospital_name ?? null,
        accepted_at: new Date().toISOString(),
      };
      if (typeof payload.eta_minutes === "number") updates.estimated_time = payload.eta_minutes;
      if (payload.note) updates.hospital_note = payload.note;
      const { data, error } = await supabase.from("emergency_requests")
.update(updates).eq("id", payload.id).select().single();
      if (error) throw error;
      return data;
    },
    {
      onMutate: async (vars) => {
        // optimistic update: mark the emergency status locally
        await queryClient.cancelQueries({ queryKey: ["emergencies", "open"] });
        const previous = queryClient.getQueryData<EmergencyLocal[]>(["emergencies", "open"]);
        queryClient.setQueryData<EmergencyLocal[] | undefined>(["emergencies", "open"], (old) =>
          (old ?? []).map((r) => (r.id === vars.id ? { ...r, status: "HOSPITAL_ACCEPTED", hospital_id: vars.hospital_id ?? r.hospital_id } : r))
        );
        return { previous };
      },
      onError: (err, vars, context: any) => {
        toast?.({
          title: "Accept failed",
          description: (err as any)?.message ?? "Could not accept the request.",
        });
        if (context?.previous) {
          queryClient.setQueryData(["emergencies", "open"], context.previous);
        }
      },
      onSuccess: (data) => {
        toast?.({
          title: "Accepted",
          description: `Emergency ${data?.id} accepted. Notifying donors & volunteers.`,
        });
        // invalidate so canonical server result refreshes
        queryClient.invalidateQueries({ queryKey: ["emergencies", "open"] });
        queryClient.invalidateQueries({ queryKey: ["emergency", data?.id] });
      },
    }
  );

  /* -------------------------
     Cancel / delete mutation (hospital-only admin action)
     ------------------------- */
  const cancelMutation = useMutation(
    async (id: string) => {
      if (!supabase) throw new Error("Supabase client not available");
      const { data, error } = await supabase.from("emergency_requests").update({ status: "CANCELLED", cancelled_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: (data) => {
        toast?.({ title: "Cancelled", description: `Emergency ${data?.id} cancelled.` });
        queryClient.invalidateQueries({ queryKey: ["emergencies", "open"] });
      },
      onError: (err) => {
        toast?.({ title: "Cancel failed", description: (err as any)?.message ?? "Could not cancel emergency." });
      },
    }
  );

  /* -------------------------
     Helper UI functions
     ------------------------- */

  const timeAgo = useCallback((d?: string | null) => (d ? formatDistanceToNowStrict(new Date(d), { addSuffix: true }) : "-"), []);

  const severityBadge = (s?: string | null) => {
    const sev = String(s ?? "").toUpperCase();
    if (sev === "CRITICAL") return <Badge className="bg-red-600 text-white">CRITICAL</Badge>;
    if (sev === "URGENT") return <Badge className="bg-orange-600 text-white">URGENT</Badge>;
    return <Badge className="bg-green-600 text-white">STABLE</Badge>;
  };

  /* -------------------------
     Event handlers
     ------------------------- */

  const handleOpenAccept = (r: EmergencyLocal) => {
    setSelected(r);
    setEtaMinutes(Math.max(5, Math.round(r.estimatedTime ?? r.estimated_time ?? 15)));
    setHospitalNote("");
  };

  const handleConfirmAccept = async () => {
    if (!selected) return;
    if (!derivedHospitalId) {
      toast?.({ title: "Cannot accept", description: "Hospital identity missing. Register the hospital to accept requests." });
      return;
    }
    setAccepting(true);
    try {
      await acceptMutation.mutateAsync({
        id: selected.id,
        hospital_id: derivedHospitalId,
        hospital_name: (profile as any)?.hospital_name ?? (profile as any)?.full_name ?? null,
        eta_minutes: etaMinutes,
        note: hospitalNote || null,
      });
      setSelected(null);
    } catch (e) {
      // handled by mutation
    } finally {
      setAccepting(false);
    }
  };

  const handleOpenRoute = async (r: EmergencyLocal) => {
    // open Google Maps directions from hospital to patient
    try {
      const patientLat = r.latitude ?? r.location_lat ?? (r as any).lat;
      const patientLng = r.longitude ?? r.location_lng ?? (r as any).lng;
      if (!patientLat || !patientLng) {
        toast?.({ title: "Location missing", description: "Patient location not available for routing." });
        return;
      }

      // attempt to fetch hospital location
      if (!derivedHospitalId) {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${patientLat},${patientLng}`)}`;
        window.open(url, "_blank");
        return;
      }

      const { data: hospitals, error } = await supabase.from("hospitals").select("location_lat,location_lng").eq("id", derivedHospitalId).limit(1);
      if (error || !hospitals || hospitals.length === 0) {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${patientLat},${patientLng}`)}`;
        window.open(url, "_blank");
        return;
      }
      const hosp = hospitals[0] as any;
      const origin = `${hosp.location_lat},${hosp.location_lng}`;
      const destination = `${patientLat},${patientLng}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(url, "_blank");
    } catch (e) {
      console.error("open route error", e);
      toast?.({ title: "Routing error", description: "Failed to open route." });
    }
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) {
      toast?.({ title: "No phone", description: "Patient phone number not available." });
      return;
    }
    window.open(`tel:${phone}`, "_self");
  };

  const handleManualRefresh = async () => {
    await emergenciesQuery.refetch();
    toast?.({ title: "Refreshed", description: "Fetched latest emergencies." });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this emergency permanently? This action cannot be undone.")) return;
    try {
      await supabase.from("emergency_requests")
.delete().eq("id", id);
      toast?.({ title: "Deleted", description: "Emergency removed." });
      queryClient.invalidateQueries({ queryKey: ["emergencies", "open"] });
    } catch (e) {
      toast?.({ title: "Delete failed", description: (e as any)?.message ?? "Could not delete." });
    }
  };

  /* -------------------------
     Render pieces
     ------------------------- */

  const HeaderBar = (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Incoming Emergencies</h2>
        <Badge className="bg-amber-100 text-amber-800">{filteredEmergencies.length} visible</Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 border rounded px-2 py-1">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search patient, address, blood group..."
            className="w-64 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded border px-2 py-1 text-sm"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="STABLE">Stable</option>
          </select>

          <button className="px-2 py-1 rounded border text-sm" onClick={() => setOnlyRecent((s) => !s)}>
            {onlyRecent ? "Recent 48h" : "All time"}
          </button>

          <Button variant="outline" onClick={handleManualRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {HeaderBar}

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: list */}
        <div className="w-96 border-r bg-white overflow-y-auto">
          {emergenciesQuery.isLoading ? (
            <div className="p-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                  Loading emergencies...
                </CardContent>
              </Card>
            </div>
          ) : emergenciesQuery.isError ? (
            <div className="p-4">
              <Card>
                <CardContent className="p-6 text-center text-red-600">Failed to load emergencies</CardContent>
              </Card>
            </div>
          ) : filteredEmergencies.length === 0 ? (
            <div className="p-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-lg font-semibold mb-2">No active emergencies</div>
                  <div className="text-sm text-slate-500">When a verified hospital raises an emergency it will appear here.</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {filteredEmergencies.map((r) => {
                const { lat, lng } = extractLatLng(r);
                const isSelected = selected?.id === r.id;
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
                    <Card className={`overflow-hidden ${isSelected ? "ring-2 ring-blue-200" : ""}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-slate-900">{r.patient_name ?? "Unknown Patient"}</div>
                              <div className="text-right">
                                <div className="text-xs text-slate-400">{safeFmt(r.created_at)}</div>
                                <div className="text-sm font-bold text-red-600">{r.blood_group}</div>
                              </div>
                            </div>

                            <div className="text-xs text-slate-500 mt-1">{r.address ?? "Address not available"}</div>

                            <div className="mt-2 flex items-center gap-2">
                              <div>{severityBadge(r.severity)}</div>
                              <div className="text-xs text-slate-400">× {r.units_required ?? 1}</div>
                              <div className="text-xs text-slate-400">Status: {String(r.status).toUpperCase()}</div>
                            </div>

                            {lat && lng ? (
                              <div className="text-xs text-slate-400 mt-2">Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Button
                              size="sm"
                              className="flex items-center gap-2 h-8 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => handleOpenAccept(r)}
                              disabled={!isHospitalAccount}
                              title={!isHospitalAccount ? "Only hospital accounts can accept" : "Accept this emergency"}
                            >
                              <Check className="w-3 h-3" /> Accept
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2 h-8 text-xs"
                              onClick={() => handleOpenRoute(r)}
                              title="Open routing in Google Maps"
                            >
                              <MapPin className="w-3 h-3" /> Route
                            </Button>

                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => handleCall(r.patient_phone)}>
                              <Phone className="w-3 h-3" /> Call
                            </Button>

                            {/* Admin small actions */}
                            {isHospitalAccount && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)} title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Map / details */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 relative">
          {filteredEmergencies.length > 0 ? (
            <LiveMap
              markers={filteredEmergencies.map((r) => {
                const { lat, lng } = extractLatLng(r);
                return {
                  id: r.id,
                  lat,
                  lng,
                  label: r.patient_name ?? r.blood_group,
                  type: "patient" as const,
                };
              })}
              center={{
                lat: extractLatLng(filteredEmergencies[0]).lat,
                lng: extractLatLng(filteredEmergencies[0]).lng,
              }}
              showRoute={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <div className="text-sm">No emergencies to display</div>
              </div>
            </div>
          )}

          {/* floating mini panel for selected request */}
          {selected && (
            <div className="absolute right-6 bottom-6 w-96 z-40">
              <Card>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">{selected.patient_name ?? "Patient"}</div>
                      <div className="text-xs text-slate-500">{selected.address}</div>
                      <div className="mt-2 text-xs text-slate-400">Requested: {selected.blood_group} × {selected.units_required}</div>
                      <div className="mt-2">{severityBadge(selected.severity)}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Accept dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Emergency</DialogTitle>
          </DialogHeader>

          {selected ? (
            <>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-slate-500">Patient</div>
                  <div className="font-medium">{selected.patient_name ?? "Unknown"}</div>
                  <div className="text-xs text-slate-400">{selected.address ?? "No address"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Blood Group</div>
                  <div className="font-semibold text-red-600">{selected.blood_group}</div>
                  <div className="text-xs text-slate-400">Units: {selected.units_required}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Estimated ETA (minutes)</div>
                  <Input
                    type="number"
                    min={1}
                    value={String(etaMinutes)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v) || v <= 0) return;
                      setEtaMinutes(Math.round(v));
                    }}
                    className="w-32 mt-1"
                  />
                </div>

                <div>
                  <div className="text-xs text-slate-500">Note (optional)</div>
                  <Input value={hospitalNote} onChange={(e) => setHospitalNote(e.target.value)} placeholder="Add note for responders" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelected(null)}><X className="w-4 h-4" /> Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmAccept} disabled={!isHospitalAccount || accepting}>
                  {accepting ? <>Accepting…</> : <><Check className="w-4 h-4" /> Accept & Notify</>}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-4 text-sm">Loading…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
