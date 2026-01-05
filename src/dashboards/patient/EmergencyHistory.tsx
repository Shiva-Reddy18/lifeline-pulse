import { Emergency } from "./PatientDashboard";

interface Props {
  history: Emergency[];
}

export default function EmergencyHistory({ history }: Props) {
  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-4">
        Emergency History
      </h3>

      {history.length === 0 ? (
        <p className="text-muted-foreground">
          No previous requests
        </p>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border-b pb-2 text-sm"
            >
              <span>
                <span className="font-medium">
                  {item.patientName}
                </span>{" "}
                – {item.bloodGroup} – {item.units} units{" "}
                <span
                  className={
                    item.emergencyLevel === "Critical"
                      ? "text-red-600 font-semibold"
                      : "text-yellow-600 font-semibold"
                  }
                >
                  • {item.emergencyLevel}
                </span>
              </span>

              <span className="font-medium">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
