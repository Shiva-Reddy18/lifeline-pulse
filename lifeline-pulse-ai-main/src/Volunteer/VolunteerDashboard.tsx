import { useEffect, useState } from "react";
import { Delivery } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { getVolunteerForCurrentUser } from "./helpers";

import VolunteerHeader from "./VolunteerHeader";
import VolunteerStats from "./VolunteerStats";
import ActiveTaskCard from "./ActiveTaskCard";
import DeliveryHistory from "./DeliveryHistory";

/* ---------------- DEMO ACTIVE DELIVERY ---------------- */
const DEMO_ACTIVE_DELIVERY: Delivery = {
  id: "demo-1",
  blood_group: "O+",
  units: 2,
  pickup_location: "City Blood Bank",
  drop_location: "Apollo Hospital",
  distance_km: 6,
  eta_min: 18,
  status: "picked_up",
  contact_phone: "9876543210",
  created_at: new Date().toISOString(),
};

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setReady(true);
        return;
      }

      const volunteer = await getVolunteerForCurrentUser(user.id);

      // ✅ Volunteer exists → real dashboard
      if (volunteer) {
        setActiveDelivery(null);
        setReady(true);
        return;
      }

      // ✅ Volunteer NOT registered → demo dashboard
      console.warn("Volunteer not found → demo mode");
      setActiveDelivery(DEMO_ACTIVE_DELIVERY);
      setReady(true);
    };

    init();
  }, [user]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading volunteer dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header (contains Availability + Profile) */}
      <VolunteerHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-10">
        {/* Stats */}
        <VolunteerStats />

        {/* Active Delivery */}
        {activeDelivery && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Active Delivery</h2>
              <span className="text-sm text-muted-foreground">
                Live task in progress
              </span>
            </div>

            <ActiveTaskCard
              delivery={activeDelivery}
              onUpdate={setActiveDelivery}
            />
          </section>
        )}

        {/* History */}
        <DeliveryHistory />
      </main>
    </div>
  );
}
