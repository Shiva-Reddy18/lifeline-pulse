import React, { useState, useCallback } from "react";
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
} from "lucide-react";
import type { EmergencyRequest } from "@/types/emergency";

const POLL_INTERVAL_MS = 6000;

export default function EmergencyRequests() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hospitalId = user?.id ?? null;
  const hospitalName = profile?.full_name ?? profile?.hospital_name ?? "Hospital";

  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [note, setNote] = useState<string>("");

  // Fetch emergencies
  const fetchEmergencies = useCallback(async (): Promise<EmergencyRequest[]> => {
    const { data, error } = await supabase
      .from("emergency_requests")
      .select("*")
      .eq("status", "created")
      .order("created_at", { ascending: false });

    if (error) throw error;
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

  // Accept mutation
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

      if (error) throw error;
      return data;
    },
    {
      onSuccess: (data) => {
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

  const openAcceptDialog = (req: EmergencyRequest) => {
    setSelectedRequest(req);
    setEtaMinutes(req.estimatedTime ?? 15);
    setNote("");
  };

  const openRoute = async (r: EmergencyRequest) => {
    try {
      // Get patient location
      const patientLat = (r as any).latitude ?? (r as any).location_lat;
      const patientLng = (r as any).longitude ?? (r as any).location_lng;

      if (!patientLat || !patientLng) {
        console.log("Patient location missing");
        return;
      }

      // If no hospital ID, just open patient location
      if (!hospitalId) {
        console.log("Hospital ID missing, opening patient location only");
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${patientLat},${patientLng}`)}`;
        window.open(url, "_blank");
        return;
      }

      // Fetch hospital location from Supabase
      const { data: hospitals, error } = await supabase
        .from("hospitals")
        .select("location_lat,location_lng")
        .eq("id", hospitalId);

      if (error) {
        console.error("Error fetching hospital:", error);
        // Fallback: open patient location only
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${patientLat},${patientLng}`)}`;
        window.open(url, "_blank");
        return;
      }

      if (!hospitals || hospitals.length === 0 || !hospitals[0].location_lat || !hospitals[0].location_lng) {
        console.log("Hospital location missing, opening patient location only");
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${patientLat},${patientLng}`)}`;
        window.open(url, "_blank");
        return;
      }

      const hospital = hospitals[0];
      // Open Google Maps directions from hospital to patient
      const origin = `${hospital.location_lat},${hospital.location_lng}`;
      const destination = `${patientLat},${patientLng}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(url, "_blank");
    } catch (e) {
      console.error("Error opening route:", e);
      return;
    }
  };

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

  const timeAgo = (iso?: string | Date | null) => {
    if (!iso) return "-";
    try {
      return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
    } catch {
      return "-";
    }
  };

  const getSeverityBadge = (request: EmergencyRequest) => {
    if (request.severity === "CRITICAL") {
      return <Badge className="bg-red-600">CRITICAL</Badge>;
    } else if (request.severity === "URGENT") {
      return <Badge className="bg-orange-600">URGENT</Badge>;
    }
    return <Badge className="bg-green-600">STABLE</Badge>;
  };

  return (
    <div className="h-screen flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-2xl font-bold text-slate-900">Incoming Emergencies</h2>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Main Content: Sidebar + Map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Emergency List */}
        <div className="w-96 border-r bg-white overflow-y-auto">
          {isLoading ? (
            <Card className="m-4">
              <CardContent className="p-6 text-center">Loading emergencies…</CardContent>
            </Card>
          ) : isError ? (
            <Card className="m-4 border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 text-center text-destructive">Failed to load emergencies</CardContent>
            </Card>
          ) : emergencies.length === 0 ? (
            <Card className="m-4">
              <CardContent className="p-6 text-center">
                <div className="text-lg font-semibold mb-2">No new emergencies</div>
                <div className="text-sm text-muted-foreground">When a patient creates an emergency it will appear here.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 p-4">
              {emergencies.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50">
                    <CardContent className="p-4">
                      {/* Patient Name & Blood Group */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{r.patient_name ?? "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{r.address ?? "Address not available"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">{r.blood_group}</div>
                          <div className="text-xs text-muted-foreground">Units: {r.units_required ?? 1}</div>
                        </div>
                      </div>

                      {/* Severity & Time */}
                      <div className="flex items-center justify-between mb-3">
                        <div>{getSeverityBadge(r)}</div>
                        <div className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2 h-8 text-xs"
                          onClick={() => openAcceptDialog(r)}
                        >
                          <Check className="w-3 h-3" /> Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2 h-8 text-xs"
                          onClick={() => openRoute(r)}
                        >
                          <AlertTriangle className="w-3 h-3" /> Route
                        </Button>
                      </div>

                      {/* Call Button */}
                      {r.patient_phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 gap-2 text-xs h-8"
                          onClick={() => window.open(`tel:${r.patient_phone}`, "_self")}
                        >
                          <Phone className="w-3 h-3" /> Call Patient
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1">
          {emergencies.length > 0 ? (
            <LiveMap
              markers={emergencies.map((r) => ({
                id: r.id,
                lat: (r as any).latitude ?? (r as any).location_lat ?? 0,
                lng: (r as any).longitude ?? (r as any).location_lng ?? 0,
                label: r.patient_name ?? "Patient",
                type: "patient",
              }))}
              center={{ lat: (emergencies[0] as any).latitude ?? (emergencies[0] as any).location_lat ?? 0, lng: (emergencies[0] as any).longitude ?? (emergencies[0] as any).location_lng ?? 0 }}
              showRoute={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No emergencies to display</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accept Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Emergency Request</DialogTitle>
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
                  <div className="font-semibold text-lg text-red-600">{selectedRequest.blood_group}</div>
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
                  className="w-32 mt-2"
                />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Note (optional)</div>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any relevant notes..."
                  className="mt-2"
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={confirmAccept} disabled={accepting}>
                  {accepting ? "Accepting..." : <><Check className="w-4 h-4" /> Accept & Notify</>}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div>Loading…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
