// src/bloodbank/BloodStockManager.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InventoryRow } from "./api";

type Props = {
  inventory: InventoryRow[];
  onAdd: (bloodGroup: string) => Promise<void> | void;
};

export default function BloodStockManager({ inventory, onAdd }: Props) {
  /* ---------------- HELPERS ---------------- */

  function getStockStatus(units: number) {
    if (units <= 3) return "critical";
    if (units <= 7) return "low";
    return "safe";
  }

  function getProgress(units: number) {
    return Math.min((units / 20) * 100, 100);
  }

  /* ---------------- EMPTY STATE ---------------- */

  if (!inventory || inventory.length === 0) {
    return (
      <Card className="bb-card animate-slideInLeft">
        <h2 className="bb-card-title">Blood Inventory</h2>
        <p className="text-gray-500 text-center py-6">
          No inventory data available
        </p>
      </Card>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <Card className="bb-card animate-slideInLeft">
      <h2 className="bb-card-title">Blood Inventory</h2>

      {inventory.map((row) => {
        const status = getStockStatus(row.units_available);

        return (
          <div
            key={row.id}
            className={`bb-stock-row bb-stock-${status}`}
          >
            {/* LEFT INFO */}
            <div className="bb-stock-info">
              <span className="bb-blood-group">
                {row.blood_group}
              </span>

              <span className="bb-units">
                {row.units_available} units
              </span>

              {/* Progress bar */}
              <div className="bb-progress">
                <div
                  className="bb-progress-fill"
                  style={{
                    width: `${getProgress(row.units_available)}%`,
                  }}
                />
              </div>

              {/* Status label */}
              {status !== "safe" && (
                <span className={`bb-stock-label ${status}`}>
                  {status === "critical" ? "CRITICAL LOW" : "LOW STOCK"}
                </span>
              )}
            </div>

            {/* ACTION */}
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await onAdd(row.blood_group);
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              + Add
            </Button>
          </div>
        );
      })}
    </Card>
  );
}
