import { useState } from "react";
import { Emergency } from "./PatientDashboard";

interface Props {
  onCreate: (data: Omit<Emergency, "id" | "status">) => void;
  patientProfile: {
    fullName: string;
    phone: string;
  } | null;
}

export default function PatientEmergencyAction({
  onCreate,
  patientProfile,
}: Props) {
  // Auto-filled from registration
  const [patientName, setPatientName] = useState(
    patientProfile?.fullName || ""
  );

  const [mobileNumber, setMobileNumber] = useState(
    patientProfile?.phone || ""
  );

  const [bloodGroup, setBloodGroup] = useState("");
  const [units, setUnits] = useState("");
  const [emergencyLevel, setEmergencyLevel] =
    useState<"Normal" | "Critical">("Normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onCreate({
      patientName,
      mobileNumber,
      bloodGroup,
      units,
      emergencyLevel,
    });

    // reset only emergency-specific fields
    setBloodGroup("");
    setUnits("");
    setEmergencyLevel("Normal");
  };

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4">
        Emergency Blood Request
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Name */}
        <div>
          <label className="text-sm font-medium">Patient Name</label>
          <input
            type="text"
            className="w-full mt-1 border rounded-md p-2 bg-muted"
            value={patientName}
            readOnly
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="text-sm font-medium">Mobile Number</label>
          <input
            type="tel"
            className="w-full mt-1 border rounded-md p-2 bg-muted"
            value={mobileNumber}
            readOnly
          />
        </div>

        {/* Blood Group */}
        <div>
          <label className="text-sm font-medium">Blood Group</label>
          <select
            className="w-full mt-1 border rounded-md p-2"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option>A+</option><option>A-</option>
            <option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option>
            <option>O+</option><option>O-</option>
          </select>
        </div>

        {/* Units */}
        <div>
          <label className="text-sm font-medium">Units Required</label>
          <input
            type="number"
            min={1}
            className="w-full mt-1 border rounded-md p-2"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            required
          />
        </div>

        {/* Emergency Level */}
        <div>
          <label className="text-sm font-medium">Emergency Level</label>
          <select
            className="w-full mt-1 border rounded-md p-2"
            value={emergencyLevel}
            onChange={(e) =>
              setEmergencyLevel(
                e.target.value as "Normal" | "Critical"
              )
            }
          >
            <option value="Normal">Normal</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
        >
          Submit Emergency Request
        </button>
      </form>
    </div>
  );
}
