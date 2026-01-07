// src/bloodbank/DailyStats.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchDailyStats, DailyStatsRow } from "./api";

export default function DailyStats() {
  const [rows, setRows] = useState<DailyStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDailyStats(14);
        setRows(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load daily statistics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- AGGREGATES ---------------- */
  const totalUnits = rows.reduce(
    (sum, r) => sum + (r.total_units ?? 0),
    0
  );
  const totalRequests = rows.reduce(
    (sum, r) => sum + (r.requests_received ?? 0),
    0
  );
  const totalFulfilled = rows.reduce(
    (sum, r) => sum + (r.requests_fulfilled ?? 0),
    0
  );
  const totalWasted = rows.reduce(
    (sum, r) => sum + (r.units_wasted ?? 0),
    0
  );

  /* ---------------- EMPTY STATE ---------------- */
  if (!loading && rows.length === 0) {
    return (
      <Card className="bb-card">
        <h3 className="bb-card-title">Daily Stats</h3>
        <p className="text-gray-500 text-center py-6">
          No statistics available
        </p>
      </Card>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Card className="bb-card">
      <h3 className="bb-card-title">
        Daily Stats (last {rows.length} days)
      </h3>

      {error && (
        <p className="text-red-600 mb-2">
          {error}
        </p>
      )}

      {/* SUMMARY CARDS */}
      <div className="bb-stats">
        <div className="bb-stat-card bg-green-500">
          <p className="bb-stat-value">{totalUnits}</p>
          <p className="bb-stat-label">Units Available</p>
        </div>

        <div className="bb-stat-card bg-blue-500">
          <p className="bb-stat-value">{totalRequests}</p>
          <p className="bb-stat-label">Requests</p>
        </div>

        <div className="bb-stat-card bg-purple-500">
          <p className="bb-stat-value">{totalFulfilled}</p>
          <p className="bb-stat-label">Fulfilled</p>
        </div>
      </div>

      {/* DAILY BREAKDOWN */}
      {rows.map((r) => (
        <div key={r.date} className="bb-request-card">
          <div>
            <p className="font-semibold">{r.date}</p>
            <p className="text-sm text-gray-600">
              Requests: {r.requests_received} •
              Fulfilled: {r.requests_fulfilled}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            Wasted: {r.units_wasted}
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-gray-500 mt-2">
          Loading statistics…
        </p>
      )}
    </Card>
  );
}
