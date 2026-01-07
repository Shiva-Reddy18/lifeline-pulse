// src/bloodbank/IncomingRequests.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Request {
  id: string;
  hospital: string;
  blood_group: string;
  units: number;
  urgency: "CRITICAL" | "NORMAL";
  status: string;
  available_units?: number;
}

interface Props {
  requests: Request[];
  approve: (id: string) => void;
  reject: (id: string) => void;
}

/* ---------------- AI-STYLE PRIORITY LOGIC ---------------- */
function calculatePriority(r: Request) {
  let score = 0;

  if (r.urgency === "CRITICAL") score += 40;
  if (r.units >= 3) score += 20;
  if (r.blood_group.includes("-")) score += 25;

  return Math.min(score, 100);
}

export default function IncomingRequests({
  requests,
  approve,
  reject,
}: Props) {
  /* ---------------- EMPTY STATE ---------------- */
  if (!requests || requests.length === 0) {
    return (
      <Card className="bb-card animate-slideInRight">
        <h2 className="bb-card-title">Incoming Requests</h2>
        <p className="text-gray-500 text-center py-6">
          No pending blood requests
        </p>
      </Card>
    );
  }

  /* ---------------- SORT BY PRIORITY ---------------- */
  const sortedRequests = [...requests].sort(
    (a, b) => calculatePriority(b) - calculatePriority(a)
  );

  return (
    <Card className="bb-card animate-slideInRight">
      <h2 className="bb-card-title">
        Incoming Requests
        <span className="ml-2 text-xs text-gray-500">
          ({sortedRequests.length})
        </span>
      </h2>

      {sortedRequests.map((r) => {
        const priority = calculatePriority(r);
        const canApprove =
          r.available_units === undefined ||
          r.available_units >= r.units;

        return (
          <div key={r.id} className="bb-request-card">
            {/* LEFT INFO */}
            <div>
              <p className="font-semibold">{r.hospital}</p>

              <p className="text-sm text-gray-600">
                {r.blood_group} • {r.units} units
              </p>

              {/* Priority score */}
              <p className="bb-priority">
                Priority Score: {priority}/100
              </p>

              {/* Stock hint */}
              {r.available_units !== undefined && !canApprove && (
                <p className="text-xs text-red-600">
                  Insufficient stock available
                </p>
              )}
            </div>

            {/* URGENCY BADGE */}
            <span
              className={`bb-badge ${
                r.urgency === "CRITICAL" ? "critical" : "normal"
              }`}
            >
              {r.urgency}
            </span>

            {/* ACTIONS */}
            {r.status === "pending" ? (
              <div className="bb-actions">
                <Button
                  size="sm"
                  className="bg-green-500"
                  disabled={!canApprove}
                  title={
                    canApprove
                      ? "Approve request"
                      : "Insufficient stock"
                  }
                  onClick={() => approve(r.id)}
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject(r.id)}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <p className="bb-status">
                {r.status.toUpperCase()}
              </p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
