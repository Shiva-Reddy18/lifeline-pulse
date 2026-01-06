import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request History</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        No previous requests to display.
      </CardContent>
    </Card>
  );
}
