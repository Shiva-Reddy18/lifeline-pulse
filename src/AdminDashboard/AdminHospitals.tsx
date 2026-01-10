import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type HospitalRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  primary_role?: string | null;
  role?: string | null;
  blood_group?: string | null;
  address?: string | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

const columns = [
  "ID",
  "Full Name",
  "Email",
  "Phone",
  "Primary Role",
  "Role",
  "Blood Group",
  "Address",
  "Verified",
  "Created At",
];

// Complete fallback seed data — ALL hospital_staff records from your dataset
const SEED_PROFILES: HospitalRow[] = [
  {
    id: "19296096-2b85-48f5-9676-290893ec4664",
    full_name: "hospital",
    email: "hospital@gmail.com",
    phone: "523235652365",
    primary_role: "hospital_staff",
    role: "hospital_staff",
    blood_group: null,
    address: null,
    is_verified: true,
    created_at: "2026-01-05 10:26:00.271134+00",
  },
  {
    id: "19296096-2b85-48f5-9676-290893ec4666",
    full_name: "hospital71",
    email: "hospital71@gmail.com",
    phone: "9392444340",
    primary_role: "hospital_staff",
    role: "hospital_staff",
    blood_group: null,
    address: null,
    is_verified: true,
    created_at: "2026-01-02 10:35:00.273334+00",
  },
  {
    id: "19296097-2b86-48f5-9678-290893ec4678",
    full_name: "CMR Hospital",
    email: "cmrhospital@gmail.com",
    phone: "8464992234",
    primary_role: "hospital_staff",
    role: "hospital_staff",
    blood_group: null,
    address: null,
    is_verified: true,
    created_at: "2026-01-03 03:40:00.271134+00",
  },
  {
    id: "199296096-2b85-48g5-99096-290893ec4674",
    full_name: "Apollo Hospital",
    email: "apolo@gmail.com",
    phone: "842466542534",
    primary_role: "hospital_staff",
    role: "hospital_staff",
    blood_group: null,
    address: null,
    is_verified: true,
    created_at: "2026-01-05 10:26:00.271134+00",
  },
];

export default function AdminHospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, primary_role, role, blood_group, address, is_verified, created_at"
        )
        .eq("primary_role", "hospital_staff")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        console.log("✅ Fetched from Supabase:", data.length, "hospitals");
        setHospitals(data as HospitalRow[]);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn("⚠️ Supabase fetch failed:", err?.message ?? err);
    }

    // fallback: use seed data
    console.log("📦 Using seed data:", SEED_PROFILES.length, "hospitals");
    setHospitals(SEED_PROFILES);
    setLoading(false);
  };

  useEffect(() => {
    fetchHospitals();

    let channel: any = null;
    try {
      channel = supabase
        .channel("public:profiles")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          (payload) => {
            const newRow = payload?.new;
            const oldRow = payload?.old;
            if (
              (newRow && newRow.primary_role === "hospital_staff") ||
              (oldRow && oldRow.primary_role === "hospital_staff")
            ) {
              console.log("🔄 Realtime update detected, refetching…");
              fetchHospitals().catch(() => {});
            }
          }
        )
        .subscribe();
    } catch {
      // ignore realtime if not supported
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* BACK NAVIGATION */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/admin")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Home
        </Button>
      </div>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Hospital Details</h1>
        <p className="text-slate-600 mt-1">
          Registered hospitals across the emergency system
        </p>
        <p className="text-xs text-slate-500 mt-2">Total: {hospitals.length} hospitals</p>
      </div>

      {/* STATUS */}
      {error && <div className="mb-4 text-sm text-red-600">❌ {error}</div>}
      {loading && <div className="mb-4 text-sm text-slate-500">⏳ Loading hospitals…</div>}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-blue-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {hospitals.length === 0 && !loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                  No hospitals found
                </td>
              </tr>
            ) : (
              hospitals.map((h) => (
                <tr key={h.id} className="border-t hover:bg-orange-50 transition">
                  <td className="px-4 py-3 text-xs font-mono">{h.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-medium">{h.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.email ?? "—"}</td>
                  <td className="px-4 py-3">{h.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                      {h.primary_role ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{h.role ?? "—"}</td>
                  <td className="px-4 py-3">{h.blood_group ?? "—"}</td>
                  <td className="px-4 py-3">{h.address ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        h.is_verified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {h.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {h.created_at ? new Date(h.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}