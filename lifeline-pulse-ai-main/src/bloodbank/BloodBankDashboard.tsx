// src/bloodbank/BloodBankDashboard.tsx
import { useState } from "react";
import BankStats from "./BankStats";
import BloodStockManager from "./BloodStockManager";
import IncomingRequests from "./IncomingRequests";
import "./bloodbank.css";

/* ✅ DEFINE TYPE HERE */
interface BloodRequest {
  id: string;
  hospital: string;
  blood_group: string;
  units: number;
  urgency: "CRITICAL" | "NORMAL";
  status: "pending" | "approved" | "rejected";
}

export default function BloodBankDashboard() {
  const [requests, setRequests] = useState<BloodRequest[]>([
    {
      id: "1",
      hospital: "Apollo Hospital",
      blood_group: "O+",
      units: 3,
      urgency: "CRITICAL",
      status: "pending",
    },
    {
      id: "2",
      hospital: "Care Hospital",
      blood_group: "A-",
      units: 2,
      urgency: "NORMAL",
      status: "pending",
    },
  ]);

  const approveRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved" } : r
      )
    );
  };

  const rejectRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "rejected" } : r
      )
    );
  };

  return (
    <div className="bb-container">
      <h1 className="bb-title">🩸 Blood Bank Dashboard</h1>

      <BankStats />

      <div className="bb-grid">
        <BloodStockManager />
        <IncomingRequests
          requests={requests}
          approve={approveRequest}
          reject={rejectRequest}
        />
      </div>
    </div>
  );
}
