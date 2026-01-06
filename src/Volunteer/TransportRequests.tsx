import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TransportRequests() {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Available Transport Requests</h3>

      <div className="flex justify-between items-center border p-3 rounded">
        <div>
          <Badge variant="destructive">CRITICAL</Badge>
          <p className="font-medium mt-1">
            City Blood Bank → Apollo Hospital
          </p>
          <p className="text-sm text-muted-foreground">
            O− • 2 units • 5 km • 15 mins
          </p>
        </div>

        <Button>Accept</Button>
      </div>
    </Card>
  );
}
