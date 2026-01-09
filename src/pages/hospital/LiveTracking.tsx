import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import LiveMap from "@/components/LiveMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Navigation, Droplet, AlertCircle, Phone, MapPin, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict } from "date-fns";

interface TrackingItem {
  id: string;
  type: "patient" | "volunteer" | "blood";
  name: string;
  status: "in_transit" | "delivered" | "pending";
  latitude: number;
  longitude: number;
  eta?: number;
  details?: string;
}

interface EmergencyCase {
  id: string;
  patient_name: string;
  patient_phone?: string;
  blood_group: string;
  units_required: number;
  status: string;
  urgency_level?: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  estimated_arrival_minutes?: number;
  hospital_name?: string;
  created_at: string;
  updated_at: string;
}

export default function LiveTracking() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const hospitalId = profile?.id ?? null;
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);

  const timeAgo = (iso?: string | Date | null) => {
    if (!iso) return "-";
    try {
      return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
    } catch {
      return "-";
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (severity === "CRITICAL") {
      return <Badge className="bg-red-600">CRITICAL</Badge>;
    } else if (severity === "URGENT") {
      return <Badge className="bg-orange-600">URGENT</Badge>;
    }
    return <Badge className="bg-green-600">STABLE</Badge>;
  };

  // Fetch active emergencies for this hospital from Supabase
  const { data: emergencies = [], isLoading } = useQuery({
    queryKey: ["active-emergencies", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];
      try {
        const { data, error } = await supabase
       .from("emergency_requests")

          .select("*")
          .eq("hospital_id", hospitalId)
          .in("status", ["created", "accepted", "in_progress"])
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return (data || []) as EmergencyCase[];
      } catch (e) {
        console.error("Error fetching emergencies:", e);
        return [];
      }
    },
    enabled: !!hospitalId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

  // Transform emergencies into tracking items
  useEffect(() => {
    const items: TrackingItem[] = emergencies.map((emergency) => ({
      id: emergency.id,
      type: "patient",
      name: `Patient: ${emergency.patient_name}`,
      status: emergency.status === "in_progress" ? "in_transit" : "pending",
      latitude: emergency.location_lat,
      longitude: emergency.location_lng,
      details: `${emergency.blood_group} x${emergency.units_required} - ${emergency.location_address}`,
      eta: emergency.estimated_arrival_minutes,
    }));
    setTrackingItems(items);
  }, [emergencies]);

  const getStatusBadge = (status: string) => {
    if (status === "in_transit") {
      return <Badge className="bg-yellow-600">In Transit</Badge>;
    } else if (status === "delivered") {
      return <Badge className="bg-green-600">Delivered</Badge>;
    }
    return <Badge className="bg-slate-600">Pending</Badge>;
  };

  const getIconByType = (type: string) => {
    if (type === "blood") return <Droplet className="w-4 h-4 text-red-600" />;
    if (type === "volunteer") return <Navigation className="w-4 h-4 text-blue-600" />;
    return <AlertCircle className="w-4 h-4 text-orange-600" />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Live Case Tracking</h2>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle>Live Location Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden border border-border">
            {trackingItems.length > 0 ? (
              <LiveMap
                markers={trackingItems.map((item) => ({
                  lat: item.latitude,
                  lng: item.longitude,
                  label: item.name,
                }))}
                center={{
                  lat: trackingItems[0]?.latitude || 40.7128,
                  lng: trackingItems[0]?.longitude || -74.006,
                }}
                zoom={14}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <p className="text-muted-foreground">No active cases to track</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Details */}
      <div className="grid grid-cols-1 gap-4">
        {trackingItems.length > 0 ? (
          trackingItems.map((item) => {
            const emergency = emergencies.find(e => e.id === item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Hospital Name & Patient Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground font-medium uppercase">
                          {emergency?.hospital_name || "Hospital"}
                        </div>
                        <div className="font-semibold text-slate-900">{item.name.replace("Patient: ", "")}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>Detected via GPS</p>
                          <p>{item.details || "Location tracking active"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{emergency?.blood_group || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">Units: {emergency?.units_required || 1}</div>
                      </div>
                    </div>

                    {/* Severity & Time */}
                    <div className="flex items-center justify-between mb-3">
                      <div>{getSeverityBadge(emergency?.urgency_level)}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(emergency?.created_at)}</div>
                    </div>

                    {/* ETA if available */}
                    {item.eta && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg mb-3">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">ETA: {item.eta} mins</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 gap-2 h-8 text-xs">
                        <Check className="w-3 h-3" /> Accept
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 h-8 text-xs">
                        <AlertCircle className="w-3 h-3" /> Route
                      </Button>
                    </div>

                    {/* Call Button */}
                    {emergency?.patient_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2 text-xs h-8"
                        onClick={() => window.open(`tel:${emergency.patient_phone}`, "_self")}
                      >
                        <Phone className="w-3 h-3" /> Call Patient
                      </Button>
                    )}

                    {/* Location & Coordinates */}
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      <p className="mb-1">Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No active cases to display
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencies.length > 0 ? (
              emergencies.map((emergency, idx) => [
                {
                  time: new Date(emergency.created_at).toLocaleTimeString(),
                  event: `Emergency request created for ${emergency.patient_name}`,
                  status: "completed",
                },
                {
                  time: emergency.updated_at ? new Date(emergency.updated_at).toLocaleTimeString() : "--:--",
                  event: `Status: ${emergency.status === "created" ? "Pending" : emergency.status === "accepted" ? "Accepted" : "In Progress"}`,
                  status: emergency.status === "in_progress" ? "in-progress" : "completed",
                },
              ]).flat().map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.status === "completed"
                          ? "bg-green-600"
                          : item.status === "in-progress"
                          ? "bg-yellow-600"
                          : "bg-slate-300"
                      }`}
                    />
                    {idx !== emergencies.length * 2 - 1 && (
                      <div
                        className={`w-1 h-12 mt-1 ${
                          item.status === "completed" ? "bg-green-600" : "bg-slate-300"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{item.time}</p>
                    <p className="text-sm text-muted-foreground">{item.event}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No emergency timeline data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      {emergencies.some(e => e.status === "in_progress") && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Active Emergency</p>
                <p className="text-sm text-yellow-800 mt-1">
                  {emergencies.filter(e => e.status === "in_progress").length} case(s) in progress. Real-time tracking is active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
