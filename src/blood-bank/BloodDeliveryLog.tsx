import { useEffect, useState } from "react";
import { getDeliveryLog, DeliveryRecord } from "./bloodBankService";
import { Truck, Hospital, Clock, Droplet } from "lucide-react";

export default function BloodDeliveryLog() {
  const [log, setLog] = useState<DeliveryRecord[]>([]);

  useEffect(() => {
    getDeliveryLog().then(setLog);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Blood Deliveries</h2>

      {log.map((d) => (
        <div
          key={d.id}
          className="p-5 rounded-xl bg-white border shadow-sm flex items-center justify-between"
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Truck className="text-blue-600" />
            </div>

            <div>
              <p className="font-semibold text-gray-800">{d.hospital}</p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-red-500" />
                {d.bloodGroup} × {d.unitsSent}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Clock size={14} />
            {new Date(d.date).toLocaleString()}
          </div>
        </div>
      ))}

      {log.length === 0 && (
        <div className="bg-white p-6 rounded-xl text-center text-gray-500">
          No deliveries yet
        </div>
      )}
    </div>
  );
}
