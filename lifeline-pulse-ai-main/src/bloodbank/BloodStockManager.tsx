// src/BloodBank/BloodStockManager.tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BloodStockManager() {
  const [stock, setStock] = useState({
    "A+": 10,
    "A-": 6,
    "B+": 12,
    "O+": 20,
    "AB+": 5,
  });

  return (
    <Card className="bb-card animate-slideInLeft">
      <h2 className="bb-card-title">Blood Stock</h2>

      {Object.entries(stock).map(([group, units]) => (
        <div key={group} className="bb-stock-row">
          <span>{group}</span>
          <span>{units} units</span>
          <Button
            size="sm"
            onClick={() =>
              setStock((prev) => ({
                ...prev,
                [group]: prev[group as keyof typeof stock] + 1,
              }))
            }
          >
            + Add
          </Button>
        </div>
      ))}
    </Card>
  );
}
