import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";



export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "patient" | "hospital" | "donor" | "volunteer" | "blood_unit";
  label?: string;
  eta?: number;
}

export interface LiveMapProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  showRoute?: boolean;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function LiveMap({
  center,
  markers = [],
  showRoute = false,
  height = "400px",
  onMarkerClick,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  /* -------------------- Simulated map load -------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  /* -------------------- Helpers -------------------- */

  const getMarkerColor = (type: MapMarker["type"]) => {
    switch (type) {
      case "patient":
        return "bg-primary";
      case "hospital":
        return "bg-medical";
      case "donor":
        return "bg-status-stable";
      case "volunteer":
        return "bg-secondary";
      case "blood_unit":
        return "bg-status-critical";
      default:
        return "bg-muted-foreground";
    }
  };

  const getMarkerIcon = (type: MapMarker["type"]) => {
    switch (type) {
      case "patient":
        return "🏥";
      case "hospital":
        return "🏨";
      case "donor":
        return "🩸";
      case "volunteer":
        return "🚑";
      case "blood_unit":
        return "💉";
      default:
        return "📍";
    }
  };

  /* -------------------- Loading -------------------- */

  if (isLoading) {
    return (
      <Card
        className="flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading live map…</p>
        </div>
      </Card>
    );
  }

  /* -------------------- Error -------------------- */

  if (mapError) {
    return (
      <Card
        className="flex items-center justify-center p-6"
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{mapError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setMapError(null)}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  /* -------------------- Map Placeholder -------------------- */

  return (
    <Card className="relative overflow-hidden" style={{ height }}>
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 relative"
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* Center marker */}
        {center && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute" />
              <div className="w-4 h-4 bg-primary rounded-full relative z-10" />
            </div>
          </div>
        )}

        {/* Legend */}
        {markers.length > 0 && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold mb-2">Live Tracking</p>
            <div className="space-y-1">
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  onClick={() => onMarkerClick?.(marker)}
                  className="flex items-center gap-2 text-xs w-full hover:bg-muted/50 rounded p-1 transition-colors"
                >
                  <span
                    className={`w-3 h-3 rounded-full ${getMarkerColor(
                      marker.type
                    )}`}
                  />
                  <span>{marker.label ?? marker.type}</span>
                  {marker.eta && (
                    <span className="text-muted-foreground ml-auto">
                      {marker.eta} min
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Route indicator */}
        {showRoute && markers.length >= 2 && (
          <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Route Active</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {markers.find((m) => m.eta)?.eta ?? "--"} min ETA
              </span>
            </div>
          </div>
        )}

        {/* Fake marker positions (UI only) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {markers.map((marker, i) => (
            <div
              key={marker.id}
              className="absolute cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${30 + i * 15}%`,
                top: `${40 + (i % 2 === 0 ? -10 : 10)}%`,
              }}
              onClick={() => onMarkerClick?.(marker)}
            >
              <div className="text-2xl">
                {getMarkerIcon(marker.type)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="w-8 h-8">
          +
        </Button>
        <Button variant="secondary" size="icon" className="w-8 h-8">
          −
        </Button>
      </div>
    </Card>
  );
}



export default LiveMap;
