import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";

type PatientProfile = {
  full_name: string;
  email: string;
  phone: string;
  blood_group: string;
  location: string;
  emergency_contact: string;
};

const PatientInfoCard = () => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<PatientProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("patientProfile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile(parsed);
      setForm(parsed);
    }
  }, []);

  const handleSave = () => {
    if (!form) return;

    localStorage.setItem("patientProfile", JSON.stringify(form));
    setProfile(form);
    setSaved(true);

    // hide success message after 2 seconds
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      {/* ================= HEADER ================= */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 font-semibold">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          Complete Profile
        </div>

        <ChevronDown
          className={`transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* ================= CONTENT ================= */}
      {open && form && (
        <div className="border-t p-6 space-y-6 bg-background">
          {/* SUCCESS MESSAGE */}
          {saved && (
            <div className="text-sm text-green-600 font-medium">
              ✅ Profile updated successfully
            </div>
          )}

          {/* FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>

            <div>
              <Label>Mobile Number</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Blood Group</Label>
              <Input value={form.blood_group} disabled />
            </div>

            <div className="md:col-span-2">
              <Label>Current Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label>Emergency Contact</Label>
              <Input
                value={form.emergency_contact}
                onChange={(e) =>
                  setForm({ ...form, emergency_contact: e.target.value })
                }
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PatientInfoCard;
