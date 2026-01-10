import { useEffect, useState } from "react";
import { getStock, updateStock, StockItem } from "./bloodBankService";
import { Plus, Minus } from "lucide-react";

export default function BloodStockTable() {
  const [items, setItems] = useState<StockItem[]>([]);

  const load = async () => setItems(await getStock() || []);

  useEffect(() => { load(); }, []);

  const update = async (group: any, delta: number) => {
    await updateStock(group, delta, false);
    await load();
  };

  const status = (u: number) => {
    if (u <= 2) return { text: "Critical", color: "bg-red-100 text-red-700 ring-red-200" };
    if (u <= 5) return { text: "Low", color: "bg-yellow-100 text-yellow-700 ring-yellow-200" };
    if (u >= 10) return { text: "High", color: "bg-blue-100 text-blue-700 ring-blue-200" };
    return { text: "Healthy", color: "bg-green-100 text-green-700 ring-green-200" };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Blood Inventory</h2>

      <div className="grid grid-cols-1 gap-3">
        {items.map((b) => {
          const s = status(b.units);
          return (
            <div
              key={b.id}
              className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between hover:shadow-md transition"
            >
              {/* Blood Group */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center font-bold text-red-600">
                  {b.bloodGroup}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{b.bloodGroup}</p>
                  <p className="text-sm text-gray-500">{b.units} units available</p>
                </div>
              </div>

              {/* Status */}
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium ring-1 ${s.color}`}
              >
                {s.text}
              </span>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => update(b.bloodGroup, 1)}
                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => update(b.bloodGroup, -1)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
