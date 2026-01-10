import React, { useEffect, useState } from "react";
import { getStock, StockItem } from "./bloodBankService";

const ShortageAlerts: React.FC = () => {
  const [critical, setCritical] = useState<StockItem[]>([]);
  const [low, setLow] = useState<StockItem[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getStock();
      setCritical(s.filter((i) => i.units <= 2));
      setLow(s.filter((i) => i.units > 2 && i.units <= 5));
    })();
  }, []);

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <div className="bg-red-200/60 backdrop-blur border border-red-300 p-4 rounded-xl">
          🔴 Critical shortage: {critical.map((c) => c.bloodGroup).join(", ")}
        </div>
      )}
      {low.length > 0 && (
        <div className="bg-yellow-200/60 backdrop-blur border border-yellow-300 p-4 rounded-xl">
          🟡 Low stock: {low.map((c) => c.bloodGroup).join(", ")}
        </div>
      )}
      {critical.length === 0 && low.length === 0 && (
        <div className="bg-green-200/60 backdrop-blur border border-green-300 p-4 rounded-xl">
          🟢 All blood groups healthy
        </div>
      )}
    </div>
  );
};

export default ShortageAlerts;
