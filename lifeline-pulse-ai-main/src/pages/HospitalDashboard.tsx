// src/pages/HospitalDashboard.tsx
import React, { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LiveMap from "@/components/LiveMap";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
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
  Clock,
  Users,
  Heart,
  RefreshCw,
} from "lucide-react";
import type { EmergencyRequest } from "@/types/emergency";

/**
 * HospitalDashboard.tsx
 *
 * Fetches live emergency_requests with status = 'created'
 * Shows a list, a map preview (if lat/lng present), and an Accept flow
 *
 * Notes:
 * - Uses react-query for fetch + polling
 * - Updates table row on Accept: status='hospital_accepted', hospital_id, hospital_name
 * - Saves optimistic UI & refetches
 */

const POLL_INTERVAL_MS = 6000;

export default function HospitalDashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hospitalId = user?.id ?? null;
  const hospitalName = profile?.full_name ?? profile?.hospital_name ?? "Hospital";

  // UI state
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [note, setNote] = useState<string>("");

  // --------------- Fetch Emergencies ----------------
  const fetchEmergencies = useCallback(async (): Promise<EmergencyRequest[]> => {
    // Query only 'created' requests (new emergencies)
    const { data, error } = await supabase
      .from("emergency_requests")
      .select("*")
      .eq("status", "created")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch emergencies", error);
      throw error;
    }
    // Defensive mapping: coerce to EmergencyRequest[]
    return (data ?? []) as EmergencyRequest[];
  }, []);

  const {
    data: emergencies = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["emergencies", "created"],
    queryFn: fetchEmergencies,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // --------------- Accept Mutation ----------------
  const acceptMutation = useMutation(
    async (payload: {
      id: string;
      hospital_id: string | null;
      hospital_name: string | null;
      status?: string;
      accepted_at?: string;
      eta_minutes?: number | null;
      note?: string | null;
    }) => {
      const { id, hospital_id, hospital_name, status, accepted_at, eta_minutes, note } = payload;
      const updates: any = {
        status: status ?? "hospital_accepted",
        hospital_id,
        hospital_name,
        accepted_at: accepted_at ?? new Date().toISOString(),
      };
      if (typeof eta_minutes === "number") updates.estimated_time = eta_minutes;
      if (note) updates.hospital_note = note;

      const { data, error } = await supabase
        .from("emergency_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Accept update failed", error);
        throw error;
      }
      return data;
    },
    {
      onSuccess: (data) => {
        // refresh list and status pages
        queryClient.invalidateQueries({ queryKey: ["emergencies", "created"] });
        queryClient.invalidateQueries({ queryKey: ["emergency", data?.id] });
        toast({
          title: "Accepted",
          description: `Accepted request ${data?.id}. Notifying volunteers/donors...`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Accept failed",
          description: err?.message ?? "Failed to accept request",
        });
      },
    }
  );

  const handleRefresh = async () => {
    await refetch();
    toast({ title: "Refreshed", description: "Fetched latest emergencies." });
  };

  // Called when hospital clicks Accept in UI (opens dialog)
  const openAcceptDialog = (req: EmergencyRequest) => {
    setSelectedRequest(req);
    setEtaMinutes(req.estimatedTime ?? 15);
    setNote("");
  };

  // Confirm Accept (call mutation)
  const confirmAccept = async () => {
    if (!selectedRequest) return;
    setAccepting(true);
    try {
      await acceptMutation.mutateAsync({
        id: selectedRequest.id,
        hospital_id: hospitalId,
        hospital_name: hospitalName,
        status: "hospital_accepted",
        accepted_at: new Date().toISOString(),
        eta_minutes: etaMinutes,
        note: note || null,
      });
      setSelectedRequest(null);
    } catch (e) {
      // handled by mutation onError
    } finally {
      setAccepting(false);
    }
  };

  // --------------- Render helpers ----------------
  const timeAgo = (iso?: string | Date | null) => {
    if (!iso) return "-";
    try {
      return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
    } catch {
      return "-";
    }
  };

  const renderLocation = (r: EmergencyRequest) => {
    if (r.latitude != null && r.longitude != null) {
      return (
        <div className="w-full h-48 rounded-md overflow-hidden border border-border">
          {/* LiveMap expects markers array - adapt if your LiveMap API differs */}
          <LiveMap
            markers={[{ lat: r.latitude, lng: r.longitude, label: r.patient_name ?? "Patient" }]}
            center={{ lat: r.latitude, lng: r.longitude }}
            zoom={14}
            className="w-full h-48"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-48 rounded-md border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
        <div className="text-center">
          <MapPin className="mx-auto mb-2 w-5 h-5 text-primary" />
          <div>Location not available</div>
          <div className="text-xs text-muted-foreground">Call patient for directions</div>
        </div>
      </div>
    );
  };

  // --------------- Main UI ----------------
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hospital Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live emergency requests near you</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Badge variant="secondary">{emergencies.length} new</Badge>
          </div>
        </motion.div>

        {/* Loading / empty states */}
        {isLoading ? (
          <div className="p-6 rounded-md bg-muted/20 text-center">Loading emergencies…</div>
        ) : isError ? (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive">Failed to load emergencies</div>
        ) : emergencies.length === 0 ? (
          <div className="p-6 rounded-md bg-muted/10 text-center">
            <div className="text-lg font-semibold mb-2">No new emergencies</div>
            <div className="text-sm text-muted-foreground">When a patient creates an emergency it will appear here.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emergencies.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Blood group</div>
                      <div className="text-xl font-semibold">{r.blood_group}</div>
                      <div className="text-xs text-muted-foreground mt-1">Units: {r.units_required ?? 1}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Requested</div>
                      <div className="font-medium">{timeAgo(r.created_at)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Status: <Badge>{(r.status ?? "unknown").toUpperCase()}</Badge></div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* patient info */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Patient</div>
                      <div className="font-semibold">{r.patient_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{r.address ?? "Address not available"}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {r.patient_phone ? (
                        <Button variant="outline" size="sm" onClick={() => window.open(`tel:${r.patient_phone}`, "_self")}>
                          <Phone className="w-4 h-4" /> Call
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground">No phone</div>
                      )}
                    </div>
                  </div>

                  {/* Map or fallback */}
                  {renderLocation(r)}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {r.condition ?? "Condition unknown"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => openAcceptDialog(r)} className="gap-2">
                        <Check className="w-4 h-4" /> Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Accept Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Emergency</DialogTitle>
            </DialogHeader>

            {selectedRequest ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Patient</div>
                    <div className="font-semibold">{selectedRequest.patient_name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{selectedRequest.patient_phone ?? "No phone"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Blood group</div>
                    <div className="font-semibold">{selectedRequest.blood_group}</div>
                    <div className="text-xs text-muted-foreground">Units: {selectedRequest.units_required ?? 1}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Estimated ETA (minutes)</div>
                  <Input
                    type="number"
                    value={String(etaMinutes)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v) || v <= 0) return;
                      setEtaMinutes(Math.round(v));
                    }}
                    className="w-32"
                  />
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Note (optional)</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setSelectedRequest(null)}><X className="w-4 h-4" /> Cancel</Button>
                  <Button variant="primary" onClick={confirmAccept} disabled={accepting} className="gap-2">
                    {accepting ? "Accepting..." : <><Check className="w-4 h-4" /> Accept & Notify</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div>Loading…</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
