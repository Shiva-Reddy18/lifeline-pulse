import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

type DonorRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  primary_role: string | null;
  role: string | null;
  blood_group: string | null;
  address: string | null;
  is_verified: boolean | null;
  created_at: string | null;
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

/* ================= COMPONENT ================= */

export default function AdminDonors() {
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        primary_role,
        role,
        blood_group,
        address,
        is_verified,
        created_at
      `)
      .eq("role", "donor")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setDonors([]);
    } else {
      setDonors((data ?? []) as DonorRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();

    // Realtime sync
    const channel = supabase
      .channel("admin-donor-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchDonors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= UI ================= */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-blue-700">
          Donor Details
        </h1>
        <p className="text-slate-600 mt-1">
          Registered donors across the emergency system
        </p>
      </div>

      {/* STATUS */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-500">
          Loading donors…
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-blue-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!loading && donors.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No donors found
                </td>
              </tr>
            ) : (
              donors.map((d) => (
                <tr
                  key={d.id}
                  className="border-t hover:bg-orange-50 transition"
                >
                  <td className="px-4 py-3">{d.id}</td>
                  <td className="px-4 py-3 font-medium">
                    {d.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{d.email ?? "—"}</td>
                  <td className="px-4 py-3">{d.phone ?? "—"}</td>
                  <td className="px-4 py-3">{d.primary_role ?? "—"}</td>
                  <td className="px-4 py-3">{d.role ?? "—"}</td>
                  <td className="px-4 py-3">{d.blood_group ?? "—"}</td>
                  <td className="px-4 py-3">{d.address ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        d.is_verified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.created_at
                      ? new Date(d.created_at).toLocaleString()
                      : "—"}
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
