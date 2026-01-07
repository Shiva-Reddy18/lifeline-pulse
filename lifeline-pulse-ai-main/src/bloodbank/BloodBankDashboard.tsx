// src/bloodbank/BloodBankDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import BankStats from "./BankStats";
import BloodStockManager from "./BloodStockManager";
import IncomingRequests from "./IncomingRequests";
import DispatchLog from "./DispatchLog";
import DonorsManager from "./DonorsManager";
import DailyStats from "./DailyStats";
import StaffManager from "./StaffManager";

import {
  fetchInventory,
  fetchRequests,
  approveRequest as apiApprove,
  rejectRequest as apiReject,
  addInventoryUnits,
  InventoryRow,
  RequestRow,
} from "./api";

import "./bloodbank.css";

export default function BloodBankDashboard() {
  const { profile } = useAuth();

  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===================== LOAD DATA ===================== */

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [inv, reqs] = await Promise.all([
        fetchInventory(),
        fetchRequests(),
      ]);
      setInventory(inv);
      setRequests(reqs);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ===================== ACTIONS ===================== */

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const approver =
        profile?.full_name ?? profile?.email ?? "bloodbank-admin";

      await apiApprove(id, approver);
      await loadData();
    } catch (e: any) {
      console.error(e);
      setError("Approval action blocked by permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(true);
    try {
      await apiReject(id);
      await loadData();
    } catch (e) {
      console.error(e);
      setError("Reject action blocked by permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (bloodGroup: string) => {
    setLoading(true);
    try {
      await addInventoryUnits(bloodGroup, 1);
      await loadData();
    } catch (e) {
      console.error(e);
      setError("Inventory update blocked by permissions");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="bb-container">
      <h1 className="bb-title">🩸 Blood Bank Dashboard</h1>

      <BankStats />

      {error && (
        <p className="text-red-600 mb-2">
          {error}
        </p>
      )}

      <div className="bb-grid">
        <div>
          <BloodStockManager
            inventory={inventory}
            onAdd={handleAdd}
          />
          <DailyStats />
        </div>

        <div>
          <IncomingRequests
            requests={requests
              .filter((r) => r.status === "pending")
              .map((r) => ({
                ...r,
                hospital: r.hospital_name,
                units: r.units_requested,
                available_units: inventory.find(
                  (i) => i.blood_group === r.blood_group
                )?.units_available,
              })) as any}
            approve={handleApprove}
            reject={handleReject}
          />

          <DonorsManager />
          <StaffManager />
        </div>
      </div>

      <DispatchLog />

      {loading && (
        <p className="text-gray-500 mt-4">
          Loading latest data…
        </p>
      )}
    </div>
  );
}
