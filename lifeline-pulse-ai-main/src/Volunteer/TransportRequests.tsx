import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, MapPin, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/* ---------------- Types ---------------- */
export interface TransportRequest {
  id: string;
  distance_km: number;
  eta_minutes: number;
}

/* ---------------- Props ---------------- */
interface Props {
  request?: TransportRequest | null;
  onAccept?: (request: TransportRequest) => void;
}

/* ---------------- Component ---------------- */
export default function TransportRequests({
  request,
  onAccept,
}: Props) {
  // ✅ DEMO FALLBACK (dashboard never breaks)
  const safeRequest: TransportRequest = request ?? {
    id: "demo-request",
    distance_km: 2.4,
    eta_minutes: 15,
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(safeRequest);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden rounded-3xl border border-red-500/40 shadow-[0_20px_50px_rgba(239,68,68,0.15)]">
        {/* Emergency Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 text-white">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Droplet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs opacity-90">Incoming Request</p>
            <h3 className="text-lg font-bold">Emergency Transport</h3>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 space-y-5">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              Blood Transport Needed
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Nearby hospital requires urgent delivery.
            </p>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-3">
            <InfoChip
              icon={<MapPin className="h-4 w-4" />}
              label={`${safeRequest.distance_km} km away`}
            />
            <InfoChip
              icon={<Clock className="h-4 w-4" />}
              label={`ETA ${safeRequest.eta_minutes} min`}
            />
          </div>

          {/* CTA */}
          <Button
            onClick={handleAccept}
            className="h-14 w-full text-lg font-semibold bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3"
          >
            Accept Request
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Helpers ---------------- */
function InfoChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
      {icon}
      {label}
    </span>
  );
}
