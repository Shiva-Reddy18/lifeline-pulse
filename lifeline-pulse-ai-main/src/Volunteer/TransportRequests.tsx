// src/Volunteer/TransportRequests.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TransportRequest {
  id: string;
  pickup: string;
  dropoff: string;
  blood_group: string;
  units: number;
  eta_minutes: number;
  urgency?: "CRITICAL" | "NORMAL";
}

interface Props {
  requests: TransportRequest[];
  accept: (req: TransportRequest) => void;
  hasActiveTask: boolean;
}

export default function TransportRequests({ requests, accept, hasActiveTask }: Props) {
  return (
    <Card className="p-6 bg-white shadow-md rounded-xl space-y-4 animate-slideInRight">
      <p className="font-semibold text-lg mb-2">Available Transport Requests</p>

      {requests.length === 0 ? (
        <p className="text-gray-500">No transport requests available</p>
      ) : hasActiveTask ? (
        <p className="text-gray-500">Complete your active delivery first</p>
      ) : (
        requests.map((r) => (
          <Card
            key={r.id}
            className="p-4 flex justify-between items-center bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition duration-300 transform hover:scale-105 animate-slideInUp"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {r.urgency && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.urgency === "CRITICAL"
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    {r.urgency}
                  </span>
                )}
                <p className="font-medium">{r.pickup} → {r.dropoff}</p>
              </div>
              <p className="text-gray-500 text-sm">
                {r.blood_group} • {r.units} units • ETA {r.eta_minutes} mins
              </p>
            </div>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white transition px-4 py-2 rounded-lg transform hover:scale-105"
              onClick={() => accept(r)}
            >
              Accept
            </Button>
          </Card>
        ))
      )}
    </Card>
  );
}
