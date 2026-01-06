// src/Volunteer/ActiveTaskCard.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, Route } from "lucide-react";
import { LiveMap } from "@/components/LiveMap";
import { useState, useEffect } from "react";

interface TransportRequest {
  id: string;
  pickup: string;
  dropoff: string;
  blood_group: string;
  units: number;
  eta_minutes: number;
  status: "accepted" | "in_transit";
  urgency?: "CRITICAL" | "NORMAL";
}

interface Props {
  request: TransportRequest;
  start: () => void;
  complete: () => void;
}

export default function ActiveTaskCard({ request, start, complete }: Props) {
  const [progress, setProgress] = useState(0);

  // Markers for LiveMap
  const markers = [
    { id: "pickup", lat: 17.385, lng: 78.4867, type: "blood_bank" as const, label: "Pickup" },
    { id: "dropoff", lat: 17.395, lng: 78.496, type: "hospital" as const, label: "Dropoff" },
  ];

  const center = {
    lat: (markers[0].lat + markers[1].lat) / 2,
    lng: (markers[0].lng + markers[1].lng) / 2,
  };

  // Animate progress bar if in_transit
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (request.status === "in_transit") {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 1;
        });
      }, (request.eta_minutes * 600)); // Smooth animation based on ETA
    }
    return () => clearInterval(timer);
  }, [request]);

  return (
    <Card className="p-6 bg-white shadow-xl rounded-xl space-y-4 transform transition hover:scale-105 hover:shadow-2xl animate-slideInUp">
      {/* Header with urgency badge */}
      <div className="flex items-center gap-2">
        <Package className="w-6 h-6 text-red-500" />
        <p className="font-semibold text-lg">Active Delivery</p>
        {request.urgency && (
          <span
            className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
              request.urgency === "CRITICAL"
                ? "bg-red-500 text-white animate-pulse"
                : "bg-yellow-400 text-black"
            }`}
          >
            {request.urgency}
          </span>
        )}
      </div>

      {/* Delivery info */}
      <p className="font-medium text-gray-700">
        {request.pickup} → {request.dropoff}
      </p>
      <p className="text-gray-500">
        {request.blood_group} • {request.units} units • ETA {request.eta_minutes} mins
      </p>

      {/* Progress Bar */}
      {request.status === "in_transit" && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Live Map */}
      {/* @ts-ignore */}
      <LiveMap center={center} markers={markers} showRoute height="250px" />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-2">
        {request.status === "accepted" && (
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition transform hover:scale-105"
            onClick={start}
          >
            <Route className="w-4 h-4 mr-1" /> Start Delivery
          </Button>
        )}
        {request.status === "in_transit" && (
          <Button
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition transform hover:scale-105"
            onClick={complete}
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Complete Delivery
          </Button>
        )}
        <Button className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition transform hover:scale-105">
          Cancel
        </Button>
      </div>
    </Card>
  );
}
