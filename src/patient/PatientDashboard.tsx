import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Mail,
  Phone,
  MapPin,
  User,
  Shield,
  Activity,
  Clock,
  HeartPulse,
} from "lucide-react";

import PatientHeader from "./PatientHeader";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import PatientInfoCard from "./PatientInfoCard";
import PatientNotifications from "./PatientNotifications";
import RequestHistory from "./RequestHistory";
// import HealthReportAnalyzer from "./HealthReportAnalyzer";
import NetworkMap from "./NetworkMap";

type PatientProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  blood_group: string | null;
  address: string | null;
  primary_role: string | null;
};

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 bg-white">
        <span className="text-gray-400">{icon}</span>
        <div className="text-sm text-gray-900 w-full">{value}</div>
      </div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition ${
        value ? "bg-red-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
          value ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeView, setActiveView] = useState<
    "dashboard" | "profile" | "ai" | "map"
  >("dashboard");

  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const resolveProfile = async () => {
      console.group("🧠 PATIENT DASHBOARD INIT");
      console.log("Step 1: Fetching auth user");

      setLoadingProfile(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("Auth result:", { user, authError });

      if (!user) {
        console.warn("No authenticated user found");
        setLoadingProfile(false);
        console.groupEnd();
        return;
      }

      setAuthEmail(user.email ?? null);

      console.log("Step 2: Trying to fetch existing profile");

      const {
        data: existingProfile,
        error: fetchError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, blood_group, address, primary_role"
        )
        .eq("id", user.id)
        .maybeSingle();

      console.log("Fetch result:", { existingProfile, fetchError });

      if (existingProfile) {
        console.log("Profile already exists, using it");
        if (mountedRef.current) {
          setProfile(existingProfile);
          setLoadingProfile(false);
        }
        console.groupEnd();
        return;
      }

      console.warn("Profile not found, performing UPSERT");

const upsertPayload = {
  id: user.id,
  email: user.email,            // ✅ REQUIRED
  full_name:
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Patient",
  phone: user.user_metadata?.phone || null,
  blood_group: user.user_metadata?.blood_group || null,
  address: null,
  primary_role: "patient",
};


      console.log("Upsert payload:", upsertPayload);

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(upsertPayload, { onConflict: "id" });

      console.log("Upsert result:", upsertError);

      if (upsertError) {
        console.error("UPSERT FAILED:", upsertError);
        toast.error(upsertError.message);
        setLoadingProfile(false);
        console.groupEnd();
        return;
      }

      console.log("Step 3: Refetching profile after upsert");

      const {
        data: newProfile,
        error: refetchError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, blood_group, address, primary_role"
        )
        .eq("id", user.id)
        .single();

      console.log("Refetch result:", { newProfile, refetchError });

      if (newProfile && mountedRef.current) {
        setProfile(newProfile);
      }

      setLoadingProfile(false);
      console.groupEnd();
    };

    resolveProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event, session);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          resolveProfile();
        }
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setAuthEmail(null);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loadingProfile) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading patient profile…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PatientHeader activeView={activeView} setActiveView={setActiveView} />

     {activeView === "dashboard" && (
  <>
    {/* Emergency button - full width */}
    <div className="w-full">
      <EmergencyBloodRequest />
    </div>

    {/* Info cards below */}
    <div className="mt-6">
  <PatientNotifications />
</div>

<div className="mt-6">
  <PatientInfoCard />
</div>


    <div className="mt-6">
      <RequestHistory />
    </div>
  </>
)}


      {activeView === "profile" && profile && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white border rounded-2xl p-5 shadow flex justify-between items-center">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl font-bold">
                {(profile.full_name || "P")[0]}
              </div>
              <div>
                {editMode ? (
                  <input
                    value={profile.full_name || ""}
                    className="text-2xl font-semibold border-b outline-none"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        full_name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <h2 className="text-2xl font-semibold">
                    {profile.full_name}
                  </h2>
                )}
                <p className="text-sm text-muted-foreground">Patient</p>
              </div>
            </div>

            <button
              disabled={saving}
              className="px-4 py-2 border rounded-lg"
              onClick={async () => {
                if (!editMode) {
                  setEditMode(true);
                  return;
                }

                setSaving(true);
                console.log("Updating profile:", profile);

                const { error } = await supabase
                  .from("profiles")
                  .update({
                    full_name: profile.full_name,
                    phone: profile.phone,
                    address: profile.address,
                    blood_group: profile.blood_group,
                  })
                  .eq("id", profile.id);

                console.log("Update result:", error);

                if (error) toast.error(error.message);
                else toast.success("Profile updated");

                setSaving(false);
                setEditMode(false);
              }}
            >
              {editMode ? "Save Profile" : "Edit Profile"}
            </button>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow space-y-4">
            <ProfileField
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              value={authEmail || "—"}
            />
            <ProfileField
              label="Phone"
              icon={<Phone className="w-4 h-4" />}
              value={
                editMode ? (
                  <input
                    value={profile.phone || ""}
                    className="w-full outline-none"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        phone: e.target.value,
                      })
                    }
                  />
                ) : (
                  profile.phone || "—"
                )
              }
            />
            <ProfileField
              label="Address"
              icon={<MapPin className="w-4 h-4" />}
              value={
                editMode ? (
                  <input
                    value={profile.address || ""}
                    className="w-full outline-none"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: e.target.value,
                      })
                    }
                  />
                ) : (
                  profile.address || "—"
                )
              }
            />
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow space-y-4">
            <div className="flex justify-between">
              <span>Push Notifications</span>
              <Toggle
                value={pushNotifications}
                onChange={setPushNotifications}
              />
            </div>
            <div className="flex justify-between">
              <span>SMS Alerts</span>
              <Toggle value={smsAlerts} onChange={setSmsAlerts} />
            </div>
            <div className="flex justify-between">
              <span>Email Updates</span>
              <Toggle value={emailUpdates} onChange={setEmailUpdates} />
            </div>
          </div>
        </div>
      )}

      {activeView === "ai" && <HealthReportAnalyzer />}
      {activeView === "map" && <NetworkMap />}
    </div>
  );
}
