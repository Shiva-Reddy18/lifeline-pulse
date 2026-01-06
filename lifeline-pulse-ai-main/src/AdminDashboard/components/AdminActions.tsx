import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button onClick={() => alert("System Report Generated")}>
          Generate Report
        </Button>
        <Button variant="destructive">Block User</Button>
      </CardContent>
    </Card>
  );
}
