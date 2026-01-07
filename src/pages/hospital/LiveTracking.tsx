import React from "react";
import { motion } from "framer-motion";
import LiveMap from "@/components/LiveMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Navigation, Droplet, AlertCircle } from "lucide-react";

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

export default function LiveTracking() {
  // Mock live tracking data
  const trackingItems: TrackingItem[] = [
    {
      id: "patient-1",
      type: "patient",
      name: "Patient: John Doe",
      status: "pending",
      latitude: 40.7128,
      longitude: -74.006,
      details: "Waiting for blood delivery",
    },
    {
      id: "vol-1",
      type: "volunteer",
      name: "Volunteer: Emergency Transport",
      status: "in_transit",
      latitude: 40.715,
      longitude: -74.009,
      eta: 8,
    },
    {
      id: "blood-1",
      type: "blood",
      name: "Blood Units (2x O+, 1x A+)",
      status: "in_transit",
      latitude: 40.712,
      longitude: -74.003,
      eta: 5,
      details: "En route from Central Blood Bank",
    },
  ];

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
            <LiveMap
              markers={trackingItems.map((item) => ({
                lat: item.latitude,
                lng: item.longitude,
                label: item.name,
              }))}
              center={{ lat: 40.7128, lng: -74.006 }}
              zoom={14}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tracking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {trackingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getIconByType(item.type)}
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.details || "Tracking active"}</p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {item.eta && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">ETA: {item.eta} mins</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <p>Lat: {item.latitude.toFixed(4)}</p>
                    <p>Lng: {item.longitude.toFixed(4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "14:30", event: "Emergency request created", status: "completed" },
              { time: "14:32", event: "Hospital accepted request", status: "completed" },
              { time: "14:35", event: "Volunteer assigned for transport", status: "completed" },
              { time: "14:38", event: "Blood units retrieved from bank", status: "in-progress" },
              { time: "14:43", event: "Delivery in progress (ETA 5 mins)", status: "in-progress" },
              { time: "--:--", event: "Delivery completed", status: "pending" },
            ].map((item, idx) => (
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
                  {idx !== 5 && (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Traffic Delay Alert</p>
              <p className="text-sm text-yellow-800 mt-1">
                Estimated delivery delayed by 3 minutes due to traffic on Main Street. Volunteer has been notified.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
