import { useEffect, useState } from "react";
import {
  getHospitalRequests,
  acceptRequest,
  rejectRequest,
  fulfillRequest,
  HospitalRequest,
} from "./bloodBankService";
import { AlertTriangle, Hospital, Check, X, Truck } from "lucide-react";

export default function HospitalRequests() {
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = async () => {
    const data = await getHospitalRequests();
    // Hide fulfilled requests
    setRequests(data.filter((r) => r.status !== "Fulfilled"));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id: string) => {
    setLoadingId(id);
    await acceptRequest(id);
    await load();
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    await rejectRequest(id);
    await load();
    setLoadingId(null);
  };

  const handleFulfill = async (id: string) => {
    setLoadingId(id);
    await fulfillRequest(id);
    await load();
    setLoadingId(null);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">
        Incoming Hospital Requests
      </h2>

      {requests.map((r) => (
        <div
          key={r.id}
          className={`p-5 rounded-xl border bg-white shadow-sm flex items-center justify-between ${
            r.urgency === "Critical" ? "ring-2 ring-red-200" : ""
          }`}
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <Hospital className="text-red-600" />
            </div>

            <div>
              <p className="font-semibold text-gray-800">{r.hospital}</p>
              <p className="text-sm text-gray-500">
                Needs <b>{r.bloodGroup}</b> × <b>{r.unitsNeeded}</b>
              </p>
            </div>

            {r.urgency === "Critical" && (
              <span className="ml-3 px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle size={14} />
                Critical
              </span>
            )}

            {r.status === "Accepted" && (
              <span className="ml-3 px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                Accepted
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {r.status === "Pending" && (
              <>
                <button
                  disabled={loadingId === r.id}
                  onClick={() => handleAccept(r.id)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Accept
                </button>

                <button
                  disabled={loadingId === r.id}
                  onClick={() => handleReject(r.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                >
                  <X size={16} />
                  Reject
                </button>
              </>
            )}

            {(r.status === "Pending" || r.status === "Accepted") && (
              <button
                disabled={loadingId === r.id}
                onClick={() => handleFulfill(r.id)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <Truck size={16} />
                Fulfill
              </button>
            )}
          </div>
        </div>
      ))}

      {requests.length === 0 && (
        <div className="bg-white p-6 rounded-xl text-center text-gray-500">
          No active hospital requests
        </div>
      )}
    </div>
  );
}
