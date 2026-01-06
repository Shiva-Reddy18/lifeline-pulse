import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Siren } from "lucide-react";

const EmergencyBloodRequest = () => {
  const { user } = useAuth();

  const triggerEmergency = async () => {
    if (!user) return;

    const { error } = await supabase.from("emergencies").insert({
      patient_id: user.id,
      blood_group: "O+",
      status: "created",
      urgency_level: "critical",
      location_address: "Auto detected",
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    if (error) {
      console.error("Emergency insert error:", error);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <Siren className="text-red-600 animate-pulse" />
        <h3 className="font-semibold text-red-700">
          Emergency Blood Request
        </h3>
      </div>

      <p className="text-sm text-red-600 mb-4">
        Alert nearby donors instantly
      </p>

      <Button
        className="w-full bg-red-600 hover:bg-red-700"
        onClick={triggerEmergency}
      >
        🚨 Trigger Emergency
      </Button>
    </div>
  );
};

export default EmergencyBloodRequest;
