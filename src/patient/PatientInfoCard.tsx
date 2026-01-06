import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

type PatientProfile = {
  full_name: string | null;
  phone: string | null;
  blood_group: string | null;
  address: string | null;
};

const PatientInfoCard = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

useEffect(() => {
  if (!user) return;

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, blood_group, address")
      .eq("id", user.id); // ❗ NO .single()

    if (error) {
      console.error("Profile fetch error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    setForm(data[0]); // ✅ take first row safely
    setLoading(false);
  };

  fetchProfile();
}, [user]);


  const handleSave = async () => {
    if (!user || !form) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      setError("Failed to save changes");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <section className="bg-white border rounded-2xl p-6">
        Loading profile...
      </section>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <section className="bg-white border rounded-2xl p-6 text-red-600">
        {error}
      </section>
    );
  }

  if (!form) return null;

  return (
    <section className="bg-white border rounded-2xl p-8 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <p className="text-sm text-muted-foreground">
            Ensure details are correct for emergencies
          </p>
        </div>
      </div>

      {saved && (
        <div className="mb-6 text-sm text-green-600 font-medium">
          ✅ Profile updated successfully
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <Label>Full Name</Label>
          <Input
            value={form.full_name ?? ""}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Mobile Number</Label>
          <Input
            value={form.phone ?? ""}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Blood Group</Label>
          <Input value={form.blood_group ?? ""} disabled />
        </div>

        <div className="md:col-span-2">
          <Label>Address</Label>
          <Input
            value={form.address ?? ""}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end border-t pt-6">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </section>
  );
};

export default PatientInfoCard;
