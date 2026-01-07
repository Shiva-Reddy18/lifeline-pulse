// src/bloodbank/StaffManager.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchStaff, StaffRow } from "./api";

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOAD STAFF ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchStaff();
        setStaff(s);
      } catch (e) {
        console.error(e);
        setError("Failed to load staff");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- EMPTY STATE ---------------- */
  if (!loading && staff.length === 0) {
    return (
      <Card className="bb-card mt-4">
        <h3 className="bb-card-title">Staff</h3>
        <p className="text-gray-500 text-center py-6">
          No staff records available
        </p>
      </Card>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Card className="bb-card mt-4">
      <h3 className="bb-card-title">Staff</h3>

      {error && (
        <p className="text-red-600 mb-2">
          {error}
        </p>
      )}

      {staff.map((s) => (
        <div key={s.id} className="bb-request-card">
          <div>
            <p className="font-semibold">
              {s.name} • {s.role ?? "—"}
            </p>
            <p className="text-sm text-gray-600">
              {s.email}
            </p>
          </div>

          <div className="text-sm">
            <span
              className={
                s.is_active
                  ? "text-green-600 font-medium"
                  : "text-gray-400"
              }
            >
              {s.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-gray-500 mt-2">
          Loading staff…
        </p>
      )}
    </Card>
  );
}
