import { useState } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  User,
  Phone,
  Mail,
  Lock,
  Bike,
  Car,
  Ambulance,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function VolunteerRegister() {
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  /* ---------------- REGISTER HANDLER ---------------- */
  const registerVolunteer = async () => {
    if (!vehicle) {
      toast({
        title: "Vehicle required",
        description: "Please select a vehicle type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ Create Auth User */
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error || !data.user) {
        toast({
          title: "Signup failed",
          description: error?.message || "Unable to register",
          variant: "destructive",
        });
        return;
      }

      const userId = data.user.id;

      /* 2️⃣ CREATE PROFILE (🔥 REQUIRED) */
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: form.email,
          full_name: form.name,
          phone: form.phone,
          primary_role: "volunteer",
        });

      if (profileError) {
        console.error(profileError);
        toast({
          title: "Profile creation failed",
          description: "Please contact support",
          variant: "destructive",
        });
        return;
      }

      /* 3️⃣ CREATE VOLUNTEER ROW */
      const { error: volunteerError } = await supabase
        .from("volunteers")
        .insert({
          id: userId, // ✅ MUST match auth.users.id
          name: form.name,
          phone: form.phone,
          is_online: false,
          total_deliveries: 0,
          on_time_rate: 0,
          rating: 0,
          vehicle_type: vehicle,
          created_at: new Date().toISOString(),
        });

      if (volunteerError) {
        console.error(volunteerError);
        toast({
          title: "Volunteer creation failed",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registration successful 🎉",
        description: "Welcome to the volunteer team!",
      });

      /* 4️⃣ SAFE REDIRECT */
      navigate("/dashboard/volunteer", { replace: true });
    } catch (err) {
      console.error(err);
      toast({
        title: "Unexpected error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.12)] p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-500 text-white shadow-md">
            <HeartPulse className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            BloodLink
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Volunteer Registration
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <Input icon={<User />} placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input icon={<Phone />} placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
          />
          <Input icon={<Mail />} placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input icon={<Lock />} type="password" placeholder="Password"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          />
        </div>

        {/* Vehicle Type */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Vehicle Type
          </p>

          <div className="grid grid-cols-3 gap-3">
            <VehicleButton label="Bike" icon={<Bike />} selected={vehicle === "Bike"} onClick={() => setVehicle("Bike")} />
            <VehicleButton label="Car" icon={<Car />} selected={vehicle === "Car"} onClick={() => setVehicle("Car")} />
            <VehicleButton label="Ambulance" icon={<Ambulance />} selected={vehicle === "Ambulance"} onClick={() => setVehicle("Ambulance")} />
          </div>
        </div>

        {/* Register Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!vehicle || loading}
          onClick={registerVolunteer}
          className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register as Volunteer"}
        </motion.button>

        <p className="text-xs text-center text-gray-500">
          Saving lives starts with you ❤️
        </p>
      </motion.div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function Input({
  icon,
  ...props
}: {
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        {...props}
        className="w-full rounded-xl border px-10 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}

function VehicleButton({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 font-semibold transition
        ${
          selected
            ? "bg-red-600 text-white border-red-600 shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
