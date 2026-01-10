import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PatientRow = {
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

// Fallback seed data — only patient records
const SEED_PROFILES: PatientRow[] = [
  {
    id: "4873af68-fa56-4f4d-955e-8c9376fd34a6",
    full_name: "sri",
    email: "patient5@gmail.com",
    phone: "6301944467",
    primary_role: "patient",
    role: "patient",
    blood_group: "O+",
    address: null,
    is_verified: true,
    created_at: "2026-01-06 09:24:50.381884+00",
  },
  {
    id: "fe61eb8c-3826-4ad3-b77e-9934e2308a78",
    full_name: "Tony Stark",
    email: "patient12@gmail.com",
    phone: "98746625324",
    primary_role: "patient",
    role: null,
    blood_group: "A+",
    address: null,
    is_verified: true,
    created_at: "2026-01-07 17:24:18.862052+00",
  },
  {
    id: "c7c66010-9f9c-416a-8010-d10cd42ccffc",
    full_name: "ghjg",
    email: "patient17@gmail.com",
    phone: "65765",
    primary_role: "patient",
    role: null,
    blood_group: "A+",
    address: null,
    is_verified: true,
    created_at: "2026-01-09 10:09:49.571724+00",
  },
  {
    id: "cb7c1f29-acdf-4dab-99ee-28013ae83cb6",
    full_name: "Shiva Prasad",
    email: "patientnew@gmail.com",
    phone: "6303658585",
    primary_role: "patient",
    role: null,
    blood_group: "A+",
    address: null,
    is_verified: true,
    created_at: "2026-01-09 09:13:24.223039+00",
  },
  {
    id: "abe6e721-9abf-44dc-a005-01819a90295a",
    full_name: "frvbcedxsdd",
    email: "deepthiy@gmail.com",
    phone: "7412589630",
    primary_role: "patient",
    role: null,
    blood_group: "O+",
    address: null,
    is_verified: true,
    created_at: "2026-01-08 04:19:16.249289+00",
  },
  {
    id: "a7ab8b1e-2ee1-4bb9-b046-86c75044f4a6",
    full_name: "patient",
    email: "patient0@gmail.com",
    phone: "8521475365",
    primary_role: "patient",
    role: null,
    blood_group: "B-",
    address: null,
    is_verified: true,
    created_at: "2026-01-09 10:11:27.758902+00",
  },
  {
    id: "874e6169-a18d-4550-8f22-91e2c22c5ba0",
    full_name: "Asam Reddy",
    email: "patient6@gmail.com",
    phone: "6303578149",
    primary_role: "patient",
    role: null,
    blood_group: "A-",
    address: null,
    is_verified: true,
    created_at: "2026-01-09 09:35:12.596222+00",
  },
  {
    id: "11806597-93d7-4a70-97b7-7ab8f31ebf5c",
    full_name: "Ram",
    email: "patient8@gmail.com",
    phone: "7894561232",
    primary_role: "patient",
    role: null,
    blood_group: "A+",
    address: null,
    is_verified: false,
    created_at: "2026-01-10 02:55:20.153173+00",
  },
];

export default function AdminPatients() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, primary_role, role, blood_group, address, is_verified, created_at"
        )
        .eq("primary_role", "patient")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        setPatients(data as PatientRow[]);
        return;
      }
    } catch (err: any) {
      console.warn(
        "Supabase fetch failed, falling back to seed data:",
        err?.message ?? err
      );
    }

    // fallback: use seed data filtered by primary_role
    setPatients(SEED_PROFILES.filter((p) => p.primary_role === "patient"));
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    let channel: any = null;
    try {
      channel = supabase
        .channel("public:profiles")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          (payload) => {
            // if patient row changed, refresh
            const newRow = payload?.new;
            const oldRow = payload?.old;
            if (
              (newRow && newRow.primary_role === "patient") ||
              (oldRow && oldRow.primary_role === "patient")
            ) {
              fetchPatients().catch(() => {});
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
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Patient Details</h1>
        <p className="text-slate-600 mt-1">
          Registered patients across the emergency system
        </p>
      </div>

      {/* status */}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      {loading && <div className="mb-4 text-sm text-slate-500">Loading patients…</div>}

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
            {patients.length === 0 && !loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t hover:bg-orange-50 transition">
                  <td className="px-4 py-3">{p.id}</td>
                  <td className="px-4 py-3 font-medium">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{p.email ?? "—"}</td>
                  <td className="px-4 py-3">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3">{p.primary_role ?? "—"}</td>
                  <td className="px-4 py-3">{p.role ?? "—"}</td>
                  <td className="px-4 py-3">{p.blood_group ?? "—"}</td>
                  <td className="px-4 py-3">{p.address ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.is_verified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
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