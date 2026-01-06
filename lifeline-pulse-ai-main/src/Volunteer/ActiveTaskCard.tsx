import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ActiveTaskCard() {
  const hasActiveTask = true; // demo flag

  if (!hasActiveTask) return null;

  return (
    <Card className="p-4 border-red-300">
      <h3 className="font-semibold mb-2">Active Delivery</h3>

      <p className="font-medium">
        City Blood Bank → Apollo Hospital
      </p>
      <p className="text-sm text-muted-foreground">
        O− • 2 units • ETA 15 mins
      </p>

      <div className="flex gap-2 mt-4">
        <Button>Start Transit</Button>
        <Button variant="success">Complete</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </Card>
  );
}
