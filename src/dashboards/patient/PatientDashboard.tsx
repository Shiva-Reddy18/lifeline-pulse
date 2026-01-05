import { useState } from "react";
import PatientEmergencyAction from "./PatientEmergencyAction";
import ActiveEmergencyCard from "./ActiveEmergencyCard";
import EmergencyHistory from "./EmergencyHistory";

export type Emergency = {
  id: string;
  patientName: string;
  mobileNumber: string;
  bloodGroup: string;
  units: string;
  emergencyLevel: "Normal" | "Critical";
  status: string;
};
type PatientProfile = {
  fullName: string;
  phone: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  email?: string;
};

export default function PatientDashboard() {
  // 🔹 Read patient profile from localStorage
const storedProfile = localStorage.getItem("patientProfile");

const patientProfile: PatientProfile | null = storedProfile
  ? (JSON.parse(storedProfile) as PatientProfile)
  : null;

  // 🔹 Tabs
  const [activeTab, setActiveTab] =
    useState<"emergency" | "history">("emergency");

  // 🔹 Emergency state
  const [activeEmergency, setActiveEmergency] =
    useState<Emergency | null>(null);

  const [history, setHistory] = useState<Emergency[]>([]);

  // 🔹 Create emergency
  const createEmergency = (
    data: Omit<Emergency, "id" | "status">
  ) => {
    const newEmergency: Emergency = {
      id: Date.now().toString(),
      ...data,
      status: "Requested",
    };

    setActiveEmergency(newEmergency);
    setActiveTab("emergency");
  };

  // 🔹 Cancel emergency
  const cancelEmergency = () => {
    if (!activeEmergency) return;

    setHistory([
      { ...activeEmergency, status: "Cancelled" },
      ...history,
    ]);
    setActiveEmergency(null);
  };

  // 🔹 Complete emergency
  const completeEmergency = () => {
    if (!activeEmergency) return;

    setHistory([
      { ...activeEmergency, status: "Delivered" },
      ...history,
    ]);
    setActiveEmergency(null);
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-6 pb-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome
            {patientProfile ? `, ${patientProfile.fullName}` : ""}
          </h1>

          {patientProfile && (
            <p className="text-muted-foreground">
              📞 {patientProfile.phone}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b">
          <button
            onClick={() => setActiveTab("emergency")}
            className={`pb-2 font-medium ${
              activeTab === "emergency"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-muted-foreground"
            }`}
          >
            Emergency
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 font-medium ${
              activeTab === "history"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-muted-foreground"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Emergency Tab */}
        {activeTab === "emergency" && (
          <>
            {!activeEmergency ? (
              <PatientEmergencyAction
                onCreate={createEmergency}
                patientProfile={patientProfile}
              />
            ) : (
              <ActiveEmergencyCard
                emergency={activeEmergency}
                onCancel={cancelEmergency}
                onComplete={completeEmergency}
              />
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <EmergencyHistory history={history} />
        )}
      </div>
    </div>
  );
}
