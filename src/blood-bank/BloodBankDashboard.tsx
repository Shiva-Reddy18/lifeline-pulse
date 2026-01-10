import React, { useEffect, useState } from "react";
import BloodBankHeader from "./BloodBankHeader";
import ShortageAlerts from "./ShortageAlerts";
import BloodStockTable from "./BloodStockTable";
import HospitalRequests from "./HospitalRequests";
import BloodDeliveryLog from "./BloodDeliveryLog";
import BloodBankRegistration from "./BloodBankRegistration";
import BloodBankApprovalStatus from "./BloodBankApprovalStatus";
import {
  getStock,
  updateStock,
  getHospitalRequests,
  getDeliveryLog,
  getApprovalStatus,
  StockItem,
} from "./bloodBankService";

const BloodBankDashboard: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [approval, setApproval] = useState<"Pending" | "Approved">("Pending");

  const refreshAll = async () => {
    const [s, r, , a] = await Promise.all([
      getStock(),
      getHospitalRequests(),
      getDeliveryLog(),
      getApprovalStatus(),
    ]);
    setStock(s);
    setRequestsCount(r.length);
    setApproval(a);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleUpdate = async (bloodGroup: any, delta: number) => {
    await updateStock(bloodGroup, delta, false);
    const s = await getStock();
    setStock(s);
  };

  const totalUnits = stock.reduce((sum, s) => sum + s.units, 0);
  const lowCount = stock.filter((s) => s.units <= 5).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <BloodBankHeader name="Downtown Blood Bank" approval={approval} />

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-3xl font-semibold">{totalUnits}</p>
          </div>
          <div className="bg-white/70 backdrop-blur border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Low / Critical</p>
            <p className="text-3xl font-semibold text-red-600">{lowCount}</p>
          </div>
          <div className="bg-white/70 backdrop-blur border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Requests</p>
            <p className="text-3xl font-semibold">{requestsCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ShortageAlerts />

            <div className="bg-white/70 backdrop-blur border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Blood Inventory</h3>
              <BloodStockTable items={stock} onUpdate={handleUpdate} />
            </div>

            <div className="bg-white/70 backdrop-blur border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Hospital Requests</h3>
              <HospitalRequests />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Registration</h3>
              <BloodBankRegistration />
            </div>

            <div className="bg-white/70 backdrop-blur border rounded-xl p-6 shadow-sm">
              <BloodBankApprovalStatus />
            </div>

            <div className="bg-white/70 backdrop-blur border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Delivery History</h3>
              <BloodDeliveryLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankDashboard;
