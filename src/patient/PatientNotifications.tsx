import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Truck,
  Clock,
  Droplet
} from "lucide-react";

type Emergency = {
  id: string;
  status: string;
  blood_group: string;
};

const steps = [
  { key: "pending", label: "Request Sent", icon: AlertCircle },
  { key: "verified", label: "Hospital Verifying", icon: Clock },
  { key: "needs_donors", label: "Finding Donors", icon: Droplet },
  { key: "accepted", label: "Donor On The Way", icon: Truck },
  { key: "fulfilled", label: "Delivered", icon: CheckCircle }
];

export default function PatientNotifications() {
  const [emergency, setEmergency] = useState<Emergency | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("emergency_requests")
        .select("id, status, blood_group")
        .eq("patient_id", user.id)
        .in("status", ["pending", "verified", "needs_donors", "accepted", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setEmergency(data || null);
    };

    load();

    const channel = supabase
      .channel("patient-emergency")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emergency_requests",
        },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!emergency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Emergency</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No emergency requests in progress.
        </CardContent>
      </Card>
    );
  }

  const currentIndex = steps.findIndex(s => s.key === emergency.status);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Active Emergency</CardTitle>
        <Badge className="bg-red-100 text-red-700">
          {steps[currentIndex]?.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between text-sm">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = index <= currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    active ? "bg-red-600 text-white" : "bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className="text-xs text-center">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-sm">
          <p><b>Blood Type:</b> {emergency.blood_group}</p>
          <p className="text-muted-foreground">
            Your request is being processed by hospitals and donors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}