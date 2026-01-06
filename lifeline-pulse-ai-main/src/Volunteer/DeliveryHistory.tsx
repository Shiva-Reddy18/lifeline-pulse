// src/Volunteer/DeliveryHistory.tsx
import { Card } from "@/components/ui/card";

interface HistoryItem {
  id: string;
  dropoff: string;
  blood_group: string;
  units: number;
}

interface Props {
  history: HistoryItem[];
}

export default function DeliveryHistory({ history }: Props) {
  return (
    <Card className="p-6 bg-white shadow-md rounded-xl space-y-3 animate-slideInLeft">
      <p className="font-semibold text-lg mb-4">Delivery History</p>

      {history.length === 0 ? (
        <p className="text-gray-500">No deliveries completed yet</p>
      ) : (
        history.map((h) => (
          <div
            key={h.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition transform hover:scale-105 animate-slideInUp"
          >
            <div className="flex flex-col">
              <p className="font-medium text-gray-700">{h.dropoff}</p>
              <p className="text-gray-500 text-sm">
                {h.blood_group} • {h.units} units
              </p>
            </div>
            <span className="text-green-500 font-bold text-lg animate-bounce">✔</span>
          </div>
        ))
      )}
    </Card>
  );
}
