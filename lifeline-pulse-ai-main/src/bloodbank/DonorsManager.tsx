// src/bloodbank/DonorsManager.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchDonors, DonorRow } from "./api";

export default function DonorsManager() {
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOAD DONORS ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchDonors();
        setDonors(d);
      } catch (e) {
        console.error(e);
        setError("Failed to load donors");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- EMPTY STATE ---------------- */
  if (!loading && donors.length === 0) {
    return (
      <Card className="bb-card">
        <h3 className="bb-card-title">Donors</h3>
        <p className="text-gray-500 text-center py-6">
          No donor records available
        </p>
      </Card>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Card className="bb-card">
      <h3 className="bb-card-title">Donors</h3>

      {error && (
        <p className="text-red-600 mb-2">
          {error}
        </p>
      )}

      {donors.map((d) => (
        <div key={d.id} className="bb-request-card">
          <div>
            <p className="font-semibold">
              {d.name} • {d.blood_group}
            </p>
            <p className="text-sm text-gray-600">
              Last donation: {d.last_donation_date ?? "—"}
            </p>
          </div>

          <div className="text-sm">
            <span
              className={
                d.is_available
                  ? "text-green-600 font-medium"
                  : "text-gray-400"
              }
            >
              {d.is_available ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-gray-500 mt-2">
          Loading donors…
        </p>
      )}
    </Card>
  );
}
