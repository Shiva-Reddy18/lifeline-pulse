import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RequestHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Blood Requests</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>O+ • 2 Units</span>
          <Badge variant="outline">Pending</Badge>
        </div>

        <div className="flex justify-between">
          <span>B+ • 1 Unit</span>
          <Badge className="bg-green-600">Approved</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestHistory;
