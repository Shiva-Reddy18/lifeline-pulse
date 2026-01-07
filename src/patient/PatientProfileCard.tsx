import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  full_name: string;
  phone: string;
  blood_group: string | null;
  address: string;
};

type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export default function PatientProfileCard() {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    blood_group: null,
    address: "",
  });

  const [authEmail, setAuthEmail] = useState<string>("");

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);

  /* 🔹 FETCH PROFILE FROM DB (robust to auth state changes) */
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!mounted) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // No authenticated user yet; stop loading and wait for auth events
        setLoading(false);
        return;
      }

      // expose the auth email separately (profiles table doesn't include email)
      setAuthEmail(user.email ?? "");

      // Fetch profile robustly; handle the case where .single() errors due to multiple rows
      try {
        const res = await supabase
          .from("profiles")
          .select("full_name, phone, blood_group, address")
          .eq("id", user.id)
          .single();

        if (!res.error && res.data) {
          setProfile(res.data);
        }
      } catch (e) {
        console.warn("single() failed in PatientProfileCard, falling back to array fetch:", e);
        const { data: rows, error: rowsErr } = await supabase
          .from("profiles")
          .select("full_name, phone, blood_group, address")
          .eq("id", user.id)
          .limit(1);

        if (!rowsErr && Array.isArray(rows) && rows[0]) {
          setProfile(rows[0]);
        }
      }

      setLoading(false);
    };

    // initial fetch
    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        fetchProfile();
      }

      if (event === "SIGNED_OUT") {
        setProfile({
          full_name: "",
          phone: "",
          blood_group: null,
          address: "",
        });
        setAuthEmail("");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          blood_group: profile.blood_group as any,
          address: profile.address,
        })
        .eq("id", user.id);
    setSaving(false);
    setEditMode(false);
    alert("Profile updated successfully ✅");
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* PROFILE HEADER */}
      <Card className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>

          <div>
            {editMode ? (
              <Input
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                className="mb-1"
              />
            ) : (
              <h2 className="text-xl font-semibold">
                {profile.full_name}
              </h2>
            )}

            <p className="text-sm text-muted-foreground">
              Patient
            </p>

            {editMode ? (
              <Input
                name="blood_group"
                value={profile.blood_group}
                onChange={handleChange}
                className="mt-1 w-24"
              />
            ) : (
              <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                {profile.blood_group}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            editMode ? handleSave() : setEditMode(true)
          }
          disabled={saving}
        >
          {editMode ? "Save Profile" : "Edit Profile"}
        </Button>
      </Card>

      {/* CONTACT INFO */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">
          Contact Information
        </h3>

        <div>
          <Label>Email</Label>
          <Input value={authEmail || "Email not set"} disabled />
        </div>

        <div>
          <Label>Phone</Label>
          <Input
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!editMode}
          />
        </div>

        <div>
          <Label>Address</Label>
          <Input
            name="address"
            value={profile.address}
            onChange={handleChange}
            disabled={!editMode}
          />
        </div>
      </Card>
    </div>
  );
}
