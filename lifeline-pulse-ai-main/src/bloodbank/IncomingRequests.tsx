// src/BloodBank/IncomingRequests.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Request {
  id: string;
  hospital: string;
  blood_group: string;
  units: number;
  urgency: "CRITICAL" | "NORMAL";
  status: string;
}

interface Props {
  requests: Request[];
  approve: (id: string) => void;
  reject: (id: string) => void;
}

export default function IncomingRequests({
  requests,
  approve,
  reject,
}: Props) {
  return (
    <Card className="bb-card animate-slideInRight">
      <h2 className="bb-card-title">Incoming Requests</h2>

      {requests.map((r) => (
        <div key={r.id} className="bb-request-card">
          <div>
            <p className="font-semibold">{r.hospital}</p>
            <p className="text-sm text-gray-600">
              {r.blood_group} • {r.units} units
            </p>
          </div>

          <span
            className={`bb-badge ${
              r.urgency === "CRITICAL" ? "critical" : "normal"
            }`}
          >
            {r.urgency}
          </span>

          {r.status === "pending" ? (
            <div className="bb-actions">
              <Button
                size="sm"
                className="bg-green-500"
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
            <p className="bb-status">{r.status.toUpperCase()}</p>
          )}
        </div>
      ))}
    </Card>
  );
}
