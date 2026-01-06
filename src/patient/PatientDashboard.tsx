import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";

import PatientHeader from "./PatientHeader";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import PatientInfoCard from "./PatientInfoCard";
import PatientNotifications from "./PatientNotifications";
import RequestHistory from "./RequestHistory";

/* ================= TYPES ================= */

type PatientProfile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  blood_group?: string | null;
  address?: string | null;
};

/* ================= SMALL UI COMPONENTS ================= */

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 bg-white">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-gray-900">{value}</span>
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

/* ================= MAIN COMPONENT ================= */

export default function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeView, setActiveView] =
    useState<"dashboard" | "profile">("dashboard");

  // Notification toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile);
        setLoadingProfile(false);
        return;
      }

      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ id: user.id })
        .select()
        .single();

      setProfile(newProfile);
      setLoadingProfile(false);
    };

    fetchProfile();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PatientHeader
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {loadingProfile && <p>Loading profile...</p>}

      {/* ================= DASHBOARD VIEW ================= */}
      {activeView === "dashboard" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmergencyBloodRequest />
            <PatientInfoCard />
          </div>

          <PatientNotifications />
          <RequestHistory />
        </>
      )}

      {/* ================= PROFILE VIEW ================= */}
      {activeView === "profile" && profile && (
        <div className="max-w-xl mx-auto space-y-5">

          {/* PROFILE HEADER */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl font-bold">
                {(profile.full_name || "P")[0]}
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  {profile.full_name || "Patient"}
                </h2>
                <p className="text-sm text-muted-foreground">Patient</p>

                {profile.blood_group && (
                  <span className="inline-block mt-2 px-3 py-1 text-sm rounded-full border border-red-200 bg-red-50 text-red-600">
                    {profile.blood_group}
                  </span>
                )}
              </div>
            </div>

            <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">
              Edit Profile
            </button>
          </div>

          {/* CONTACT INFORMATION */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              Contact Information
            </h3>

            <ProfileField
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              value={profile.email || "Email not set"}
            />

            <ProfileField
              label="Phone"
              icon={<Phone className="w-4 h-4" />}
              value={profile.phone || "—"}
            />

            <ProfileField
              label="Address"
              icon={<MapPin className="w-4 h-4" />}
              value={profile.address || "—"}
            />
          </div>

          {/* NOTIFICATIONS */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              Notifications
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for nearby requests
                </p>
              </div>
              <Toggle
                value={pushNotifications}
                onChange={setPushNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get emergency alerts via text
                </p>
              </div>
              <Toggle
                value={smsAlerts}
                onChange={setSmsAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Updates</p>
                <p className="text-sm text-muted-foreground">
                  Weekly summary and updates
                </p>
              </div>
              <Toggle
                value={emailUpdates}
                onChange={setEmailUpdates}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
