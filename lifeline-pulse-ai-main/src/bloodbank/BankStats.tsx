// src/BloodBank/BankStats.tsx
import { Card } from "@/components/ui/card";

export default function BankStats() {
  const stats = [
    { label: "Available Units", value: "128", color: "bg-green-500" },
    { label: "Pending Requests", value: "5", color: "bg-yellow-500" },
    { label: "Critical Alerts", value: "2", color: "bg-red-500" },
  ];

  return (
    <div className="bb-stats">
      {stats.map((s) => (
        <Card
          key={s.label}
          className={`bb-stat-card ${s.color}`}
        >
          <p className="bb-stat-value">{s.value}</p>
          <p className="bb-stat-label">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
