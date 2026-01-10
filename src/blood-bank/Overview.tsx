import { useEffect, useState } from "react";
import {
  Droplet,
  AlertTriangle,
  Truck,
  HeartPulse,
  Clock,
  Activity,
} from "lucide-react";
import { getStock, getHospitalRequests, StockItem } from "./bloodBankService";

export default function Overview() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [requests, setRequests] = useState(0);

  useEffect(() => {
    getStock().then(setStock);
    getHospitalRequests().then((r) => setRequests(r.length));
  }, []);

  const total = stock.reduce((s, i) => s + i.units, 0);
  const low = stock.filter((i) => i.units <= 5).length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Blood Bank Command Center
      </h1>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Blood Units"
          value={total}
          icon={<Droplet className="text-red-500" />}
          bg="bg-red-50"
        />
        <StatCard
          title="Low Stock Groups"
          value={low}
          icon={<AlertTriangle className="text-orange-500" />}
          bg="bg-orange-50"
        />
        <StatCard
          title="Hospital Requests"
          value={requests}
          icon={<Truck className="text-blue-500" />}
          bg="bg-blue-50"
        />
        <StatCard
          title="Delivery Success"
          value="98%"
          icon={<HeartPulse className="text-green-500" />}
          bg="bg-green-50"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Average Response Time"
          value="12 mins"
          icon={<Clock className="text-purple-500" />}
        />
        <MetricCard
          title="Blood Match Success"
          value="97%"
          icon={<Activity className="text-indigo-500" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: any) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border bg-white flex items-center justify-between`}
    >
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${bg}`}>{icon}</div>
    </div>
  );
}

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl">{icon}</div>
    </div>
  );
}
