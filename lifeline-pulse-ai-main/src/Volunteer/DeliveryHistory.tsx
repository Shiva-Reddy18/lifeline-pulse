import { Card } from "@/components/ui/card";

export default function DeliveryHistory() {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Delivery History</h3>

      <ul className="space-y-2 text-sm">
        <li>✔ Apollo Hospital • O− • 2 units</li>
        <li>✔ KIMS Hospital • B+ • 1 unit</li>
        <li>✔ Care Hospital • A+ • 1 unit</li>
      </ul>
    </Card>
  );
}
