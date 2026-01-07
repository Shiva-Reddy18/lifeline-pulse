import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmergencyButton } from "@/components/EmergencyButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type PatientProfile = {
  full_name: string | null;
  blood_group: string | null;
  phone: string | null;
  address: string | null;
};

export default function EmergencyBloodRequest() {
  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
    refresh,
  } = useGeolocation();

  const { toast } = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);
  const [pendingEmergency, setPendingEmergency] = useState(false);

  /* ================= FETCH PATIENT PROFILE ================= */

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      console.log("👤 Fetching patient profile for emergency");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, blood_group, phone, address")
        .eq("id", user.id)
        .maybeSingle();

      console.log("👤 Profile fetch result:", { data, error });

      if (error || !data) {
        toast({
          title: "Profile incomplete",
          description: "Please complete your profile before sending emergency.",
          variant: "destructive",
        });
        setProfileLoading(false);
        return;
      }

      setProfile(data);
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user]);

  /* ================= SEND EMERGENCY ================= */

  const sendEmergency = async () => {
    if (!user || !latitude || !longitude || !profile) return;

    if (!profile.full_name || !profile.blood_group) {
      toast({
        title: "Profile incomplete",
        description: "Name and blood group are required.",
        variant: "destructive",
      });
      return;
    }

    console.log("🚨 SENDING EMERGENCY", {
      patient_id: user.id,
      patient_name: profile.full_name,
      blood_group: profile.blood_group,
      latitude,
      longitude,
    });

    try {
      setIsSending(true);

      const { error } = await supabase.from("emergency_requests").insert({
        patient_id: user.id,
        patient_name: profile.full_name,
        patient_phone: profile.phone,
        blood_group: profile.blood_group,
        address: profile.address,
        latitude,
        longitude,
        status: "active",
      });

      if (error) {
        console.error("❌ Emergency insert error:", error);
        throw error;
      }

      toast({
        title: "Emergency Alert Sent 🚨",
        description: "Nearby donors and hospitals are being notified.",
      });
    } catch (err: any) {
      toast({
        title: "Emergency failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setPendingEmergency(false);
    }
  };

  /* ================= CLICK HANDLER ================= */

  const handleEmergencyClick = () => {
    console.log("🖱️ EMERGENCY CLICKED");

    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    if (profileLoading) {
      toast({
        title: "Loading profile…",
        description: "Please wait a moment.",
      });
      return;
    }

    if (!latitude || !longitude) {
      console.log("📍 Location missing → requesting");
      setPendingEmergency(true);
      refresh();

      toast({
        title: "Getting your location…",
        description: "Please allow location access.",
      });
      return;
    }

    sendEmergency();
  };

  /* ================= AUTO SEND AFTER LOCATION ================= */

  useEffect(() => {
    if (pendingEmergency && latitude && longitude && profile) {
      console.log("📍 Location resolved → auto sending emergency");
      sendEmergency();
    }
  }, [pendingEmergency, latitude, longitude, profile]);

  return (
    <Card className="border-none p-8 flex flex-col items-center justify-center min-h-[420px]">
      <h2 className="text-lg font-medium text-gray-700 mb-6">
        Emergency Blood Request
      </h2>

      <EmergencyButton
        onTrigger={handleEmergencyClick}
        isLoading={isSending || locationLoading || profileLoading}
      />

      <p className="mt-10 text-sm text-muted-foreground text-center max-w-xs">
        Tap for urgent blood requests. Help is nearby.
      </p>

      {locationError && (
        <p className="mt-4 text-xs text-red-500">
          Location error: {locationError}
        </p>
      )}
    </Card>
  );
}
