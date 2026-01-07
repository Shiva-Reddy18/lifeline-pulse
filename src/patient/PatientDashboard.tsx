import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Phone, MapPin, User } from "lucide-react";

import HealthReportAnalyzer from "./HealthReportAnalyzer";
import NetworkMap from "./NetworkMap";
import PatientHeader from "./PatientHeader";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import PatientInfoCard from "./PatientInfoCard";
import PatientNotifications from "./PatientNotifications";
import RequestHistory from "./RequestHistory";

/* ================= TYPES ================= */

type PatientProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  blood_group: string | null;
  address: string | null;
};

/* ================= SMALL UI COMPONENTS ================= */

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

/* ================= MAIN COMPONENT ================= */

export default function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [activeView, setActiveView] = useState<
    "dashboard" | "profile" | "ai" | "map"
  >("dashboard");

  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  /* ================= FETCH PROFILE (FINAL SAFE VERSION) ================= */

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!mounted) return;
      setLoadingProfile(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // If there's no user yet, stop loading and wait for auth events
        setLoadingProfile(false);
        return;
      }

      setAuthEmail(user.email ?? null);

      // Try to fetch a single profile. If .single() fails because the DB returned multiple
      // rows (e.g. inconsistency), fall back to fetching an array and using the first row.
      let profileData = null;
      let fetchError: any = null;

      try {
        const res = await supabase
          .from("profiles")
          .select("id, full_name, phone, blood_group, address")
          .eq("id", user.id)
          .single();

        profileData = res.data ?? null;
        fetchError = res.error ?? null;
      } catch (e) {
        // Known edge: "Cannot coerce the result to a single JSON object" when multiple rows are returned.
        console.warn("single() failed for profiles, trying fallback array query:", e);

        const { data: rows, error: rowsErr } = await supabase
          .from("profiles")
          .select("id, full_name, phone, blood_group, address")
          .eq("id", user.id)
          .limit(1);

        if (rowsErr) {
          fetchError = rowsErr;
        } else {
          profileData = Array.isArray(rows) ? rows[0] ?? null : rows ?? null;
        }
      }

      if (fetchError) {
        // Show friendly message instead of raw DB error where possible
        console.error("Error fetching profile:", fetchError);
        toast.error("Error fetching profile. Please contact support if this persists.");
        setLoadingProfile(false);
        return;
      }

      setProfile(profileData);
      setLoadingProfile(false);
    };

    // Initial fetch
    fetchProfile();

    // Subscribe to auth state changes so we refetch when the user signs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          fetchProfile();
        }

        if (event === "SIGNED_OUT") {
          // clear profile immediately on sign-out
          setProfile(null);
          setAuthEmail(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <PatientHeader activeView={activeView} setActiveView={setActiveView} />

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
      {activeView === "profile" && (
        <div className="max-w-xl mx-auto space-y-5">
          {loadingProfile ? (
            <div className="text-center py-10 text-muted-foreground">Loading profile...</div>
          ) : profile ? (
            <>
              {/* HEADER CARD */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl font-bold">
                    {(profile.full_name || "P")[0]}
                  </div>

                  <div>
                    {editMode ? (
                      <input
                        className="text-2xl font-semibold border-b outline-none bg-transparent"
                        value={profile.full_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                      />
                    ) : (
                      <h2 className="text-2xl font-semibold">
                        {profile.full_name || "Patient"}
                      </h2>
                    )}

                    <p className="text-sm text-muted-foreground">Patient</p>

                    {profile.blood_group && (
                      <span className="inline-block mt-2 px-3 py-1 text-sm rounded-full border border-red-200 bg-red-50 text-red-600">
                        {profile.blood_group}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  disabled={saving}
                  onClick={async () => {
                    if (!editMode) {
                      setEditMode(true);
                      return;
                    }

                    setSaving(true);

                    const { error } = await supabase
                      .from("profiles")
                      .update({
                        full_name: profile.full_name,
                        phone: profile.phone,
                        address: profile.address,
                        blood_group: profile.blood_group,
                      })
                      .eq("id", profile.id);

                    if (error) {
                      toast.error(error.message);
                    } else {
                      toast.success("Profile updated successfully");
                    }

                    setSaving(false);
                    setEditMode(false);
                  }}
                >
                  {editMode ? "Save Profile" : "Edit Profile"}
                </button>
              </div>

              {/* CONTACT INFO */}
              <div className="bg-white border rounded-2xl p-4 shadow space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" />
                  Contact Information
                </h3>

                <ProfileField
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  value={authEmail || "Email not set"}
                />

                <ProfileField
                  label="Phone"
                  icon={<Phone className="w-4 h-4" />}
                  value={
                    editMode ? (
                      <input
                        className="w-full outline-none bg-transparent"
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
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
                        className="w-full outline-none bg-transparent"
                        value={profile.address || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, address: e.target.value })
                        }
                      />
                    ) : (
                      profile.address || "—"
                    )
                  }
                />
              </div>

              {/* NOTIFICATIONS */}
              <div className="bg-white border rounded-2xl p-4 shadow space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500" />
                  Notifications
                </h3>

                <div className="flex items-center justify-between">
                  <p className="font-medium">Push Notifications</p>
                  <Toggle value={pushNotifications} onChange={setPushNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-medium">SMS Alerts</p>
                  <Toggle value={smsAlerts} onChange={setSmsAlerts} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-medium">Email Updates</p>
                  <Toggle value={emailUpdates} onChange={setEmailUpdates} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Profile not found. If you just signed up, please reload or sign out and sign in again.
            </div>
          )}
        </div>
      )}

      {/* ================= OTHER VIEWS ================= */}
      {activeView === "ai" && <HealthReportAnalyzer />}
      {activeView === "map" && <NetworkMap />}
    </div>
  );
}
