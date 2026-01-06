// src/Volunteer/VolunteerDashboard.tsx
import { useState } from "react";
import AvailabilityToggle from "./AvailabilityToggle";
import VolunteerStats from "./VolunteerStats";
import TransportRequests from "./TransportRequests";
import ActiveTaskCard from "./ActiveTaskCard";
import DeliveryHistory from "./DeliveryHistory";

export default function VolunteerDashboard() {
  const [available, setAvailable] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [requests, setRequests] = useState([
    { id: "1", pickup: "City Blood Bank", dropoff: "Apollo Hospital", blood_group: "O−", units: 2, eta_minutes: 15, status: "accepted" },
    { id: "2", pickup: "KIMS Blood Bank", dropoff: "Care Hospital", blood_group: "B+", units: 1, eta_minutes: 20, status: "accepted" },
  ]);
  const [history, setHistory] = useState([
    { id: "h1", dropoff: "Apollo Hospital", blood_group: "O−", units: 2 },
    { id: "h2", dropoff: "KIMS Hospital", blood_group: "B+", units: 1 },
  ]);

  const handleAccept = (req: any) => {
    setActiveTask({ ...req, status: "accepted" });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const handleStart = () => {
    if (activeTask) setActiveTask({ ...activeTask, status: "in_transit" });
  };

  const handleComplete = () => {
    if (activeTask) {
      setHistory((prev) => [...prev, activeTask]);
      setActiveTask(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <AvailabilityToggle available={available} setAvailable={setAvailable} />
      <VolunteerStats
        role="Transport Volunteer"
        level="Silver"
        sos={2}
        pending={requests.length}
        active={activeTask ? 1 : 0}
        completed={history.length}
        livesSaved={history.length}
      />
      <TransportRequests requests={requests} accept={handleAccept} hasActiveTask={!!activeTask} />
      {activeTask && (
        <ActiveTaskCard request={activeTask} start={handleStart} complete={handleComplete} />
      )}
      <DeliveryHistory history={history} />
    </div>
  );
}
