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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Activity,
  Droplet,
  AlertTriangle,
  Menu,
  BarChart3,
  FileText,
  Navigation,
  Settings,
  LogOut,
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

interface HospitalStats {
  pendingRequests: number;
  activeRequests: number;
  totalDonorsConnected: number;
  bloodUnitsAvailable: number;
}

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({
    pendingRequests: 0,
    activeRequests: 0,
    totalDonorsConnected: 0,
    bloodUnitsAvailable: 0,
  });

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 fixed h-screen left-0 top-0 z-40 overflow-y-auto`}>
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

        <nav className="mt-8 space-y-2 px-3">
          {[
            { icon: BarChart3, label: "Overview", id: "overview" },
            { icon: AlertTriangle, label: "Emergency Requests", id: "emergencies" },
            { icon: Droplet, label: "Blood Coordination", id: "blood" },
            { icon: Navigation, label: "Live Case Tracking", id: "tracking" },
            { icon: FileText, label: "History & Records", id: "history" },
            { icon: Settings, label: "Settings", id: "settings" },
          ].map(({ icon: Icon, label, id }) => (
            <motion.button
              key={id}
              whileHover={{ paddingLeft: 24 }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 transition-all text-sm font-medium text-slate-200"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
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
                <p className="text-sm text-slate-500 mt-1">Live emergency requests dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                <Button variant="ghost" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Pending Requests</p>
                        <p className="text-3xl font-bold mt-2">{emergencies.length}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Active Cases</p>
                        <p className="text-3xl font-bold mt-2">{hospitalStats.activeRequests}</p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Activity className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Donors Connected</p>
                        <p className="text-3xl font-bold mt-2">{hospitalStats.totalDonorsConnected}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Blood Units Available</p>
                        <p className="text-3xl font-bold mt-2">{hospitalStats.bloodUnitsAvailable}</p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Droplet className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="incoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
                <TabsTrigger value="incoming">Incoming Emergencies</TabsTrigger>
                <TabsTrigger value="active">Active Cases</TabsTrigger>
                <TabsTrigger value="blood">Blood Inventory</TabsTrigger>
              </TabsList>

              {/* Incoming Emergencies Tab */}
              <TabsContent value="incoming" className="mt-6">
                {isLoading ? (
                  <Card>
                    <CardContent className="p-6 text-center">Loading emergencies…</CardContent>
                  </Card>
                ) : isError ? (
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-6 text-center text-destructive">Failed to load emergencies</CardContent>
                  </Card>
                ) : emergencies.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-lg font-semibold mb-2">No new emergencies</div>
                      <div className="text-sm text-muted-foreground">When a patient creates an emergency it will appear here.</div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {emergencies.map((r) => (
                      <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="grid md:grid-cols-3 gap-4 p-4">
                            {/* Left: Patient Info */}
                            <div>
                              <div className="text-xs font-medium text-muted-foreground uppercase">Patient</div>
                              <div className="font-semibold mt-2">{r.patient_name ?? "Unknown"}</div>
                              <div className="text-xs text-muted-foreground mt-1">{r.address ?? "Address not available"}</div>
                              {r.patient_phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3 w-full gap-2"
                                  onClick={() => window.open(`tel:${r.patient_phone}`, "_self")}
                                >
                                  <Phone className="w-3 h-3" /> Call
                                </Button>
                              )}
                            </div>

                            {/* Middle: Blood & Time Info */}
                            <div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground uppercase">Blood Group</div>
                                  <div className="text-2xl font-bold text-red-600 mt-2">{r.blood_group}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Units: {r.units_required ?? 1}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground uppercase">Requested</div>
                                  <div className="font-medium mt-2">{timeAgo(r.created_at)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Status: <Badge variant="outline">{(r.status ?? "unknown").toUpperCase()}</Badge></div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Map & Actions */}
                            <div className="flex flex-col gap-3">
                              {renderLocation(r)}
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 gap-2"
                                onClick={() => openAcceptDialog(r)}
                              >
                                <Check className="w-4 h-4" /> Accept Request
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Active Cases Tab */}
              <TabsContent value="active" className="mt-6">
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No active cases at the moment
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Blood Inventory Tab */}
              <TabsContent value="blood" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Blood Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bloodType) => (
                        <div key={bloodType} className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">{bloodType}</div>
                          <div className="text-xs text-muted-foreground mt-2">0 units</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
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

              <div className="flex items-center gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={() => setSelectedRequest(null)}><X className="w-4 h-4" /> Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={confirmAccept} disabled={accepting}>
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
  );
}
