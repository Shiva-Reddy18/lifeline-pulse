// src/bloodbank/DispatchLog.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchDispatchLog, DispatchRow } from "./api";

export default function DispatchLog() {
  const [rows, setRows] = useState<DispatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDispatchLog();
        setRows(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load dispatch log");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- UI-ONLY STATUS UPDATE ---------------- */
  const markReceived = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, delivery_status: "received" }
          : r
      )
    );
  };

  /* ---------------- EMPTY STATE ---------------- */
  if (!loading && rows.length === 0) {
    return (
      <Card className="bb-card mt-4">
        <h3 className="bb-card-title">Dispatch Log</h3>
        <p className="text-gray-500 text-center py-6">
          No dispatch records available
        </p>
      </Card>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Card className="bb-card mt-4">
      <h3 className="bb-card-title">Dispatch Log</h3>

      {error && (
        <p className="text-red-600 mb-2">
          {error}
        </p>
      )}

      {rows.map((r) => (
        <div key={r.id} className="bb-request-card">
          <div>
            <p className="font-semibold">
              {r.blood_group} • {r.units_dispatched} units
            </p>
            <p className="text-sm text-gray-600">
              {r.dispatch_time
                ? new Date(r.dispatch_time).toLocaleString()
                : "—"}{" "}
              •{" "}
              <span className="font-medium">
                {r.delivery_status ?? "pending"}
              </span>
            </p>
          </div>

          <div className="text-sm text-gray-600">
            Driver: {r.driver_name ?? "—"}
          </div>

          <div>
            {r.delivery_status !== "received" && (
              <button
                className="btn btn-sm"
                onClick={() => markReceived(r.id)}
              >
                Mark received
              </button>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-gray-500 mt-2">
          Loading…
        </p>
      )}
    </Card>
  );
}
