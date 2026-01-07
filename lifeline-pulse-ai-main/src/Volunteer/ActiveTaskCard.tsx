import { Delivery } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Droplet,
  Clock,
  MapPin,
  Phone,
  Play,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  delivery: Delivery;
  onUpdate: (d: Delivery | null) => void;
}

export default function ActiveTaskCard({ delivery, onUpdate }: Props) {
  /* ---------------- START DELIVERY ---------------- */
  const startDelivery = async () => {
    try {
      // Try DB update (real mode)
      const { data, error } = await supabase
        .from("deliveries")
        .update({ status: "picked_up" })
        .eq("id", delivery.id)
        .select()
        .single();

      if (error || !data) {
        // 🟡 DEMO FALLBACK
        onUpdate({ ...delivery, status: "picked_up" });
        return;
      }

      onUpdate(data as Delivery);
    } catch {
      // 🟡 DEMO FALLBACK
      onUpdate({ ...delivery, status: "picked_up" });
    }
  };

  /* ---------------- COMPLETE DELIVERY ---------------- */
  const completeDelivery = async () => {
    try {
      await supabase
        .from("deliveries")
        .update({
          status: "delivered",
          completed_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);
    } catch {
      // ignore DB error in demo
    }

    // Always clear active task
    onUpdate(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden rounded-3xl border border-red-500/40 bg-white shadow-[0_20px_60px_rgba(239,68,68,0.18)]">
        {/* Emergency Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Droplet />
            </motion.div>
            <div>
              <p className="text-sm opacity-90">Active Task</p>
              <h3 className="font-bold text-lg">
                Emergency Blood Delivery
              </h3>
            </div>
          </div>

          <span className="px-3 py-1 text-xs rounded-full bg-white/20 backdrop-blur">
            PRIORITY
          </span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {delivery.blood_group}
                <span className="text-red-600"> • </span>
                {delivery.units} Units
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <StatBadge
                  icon={<Clock className="h-4 w-4" />}
                  label={`${delivery.eta_min} min ETA`}
                />
                <StatBadge
                  icon={<MapPin className="h-4 w-4" />}
                  label={`${delivery.distance_km} km away`}
                />
              </div>
            </div>

            {delivery.contact_phone && (
              <a
                href={`tel:${delivery.contact_phone}`}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
          </div>

          {/* Route */}
          <div className="rounded-2xl border bg-gray-50 p-4 space-y-4">
            <RouteItem label="Pickup" value={delivery.pickup_location} />
            <div className="flex justify-center">
              <ArrowRight className="text-gray-400" />
            </div>
            <RouteItem label="Drop" value={delivery.drop_location} />
          </div>

          {/* Actions */}
          {delivery.status === "accepted" && (
            <PrimaryButton
              color="green"
              icon={<Play className="h-5 w-5" />}
              onClick={startDelivery}
              label="Start Delivery"
            />
          )}

          {delivery.status === "picked_up" && (
            <PrimaryButton
              color="blue"
              icon={<CheckCircle className="h-5 w-5" />}
              onClick={completeDelivery}
              label="Mark as Delivered"
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------- UI Helpers ---------- */

function StatBadge({
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

function RouteItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">
        {label}
      </p>
      <p className="text-base font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label,
  icon,
  color,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  color: "green" | "blue";
}) {
  const styles =
    color === "green"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <Button
      onClick={onClick}
      className={`h-14 w-full text-lg font-semibold text-white flex items-center justify-center gap-3 ${styles}`}
    >
      {icon}
      {label}
    </Button>
  );
}
