import { Emergency } from "./PatientDashboard";

interface Props {
  emergency: Emergency;
  onCancel: () => void;
  onComplete: () => void;
}

export default function ActiveEmergencyCard({
  emergency,
  onCancel,
  onComplete,
}: Props) {
 return (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
    <h3 className="text-xl font-semibold text-red-700 mb-4">
      Active Emergency
    </h3>

    <div className="space-y-2 text-sm">
      <p><strong>Patient:</strong> {emergency.patientName}</p>
      <p><strong>Blood Group:</strong> {emergency.bloodGroup}</p>
      <p><strong>Units:</strong> {emergency.units}</p>
      <p><strong>Status:</strong> {emergency.status}</p>
      <p>
  <strong>Emergency Level:</strong>{" "}
  <span
    className={
      emergency.emergencyLevel === "Critical"
        ? "text-red-600 font-semibold"
        : "text-yellow-600 font-semibold"
    }
  >
    {emergency.emergencyLevel}
  </span>
</p>

    </div>

    <div className="flex gap-3 mt-6">
      <button
        onClick={onComplete}
        className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
      >
        Mark as Delivered
      </button>

      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 py-2 rounded-md hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
);
}