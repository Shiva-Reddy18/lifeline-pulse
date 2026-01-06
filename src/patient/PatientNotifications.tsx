import {
  AlertCircle,
  CheckCircle,
  Truck,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientNotifications() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Request</CardTitle>
        <Badge className="bg-green-100 text-green-700">
          Accepted
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <Step icon={<AlertCircle />} label="Request Sent" active />
          <Line active />
          <Step icon={<CheckCircle />} label="Accepted" active />
          <Line />
          <Step icon={<Truck />} label="In Transit" />
          <Line />
          <Step icon={<CheckCircle />} label="Delivered" />
        </div>

        {/* Info */}
        <div className="text-sm">
          <p><b>Accepted by:</b> City General Hospital</p>
          <p><b>Blood Type:</b> O+</p>
          <p className="text-red-600 mt-1">⏱ ETA: 15 minutes</p>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 border-t pt-4">
          <Activity title="Blood request completed" time="2 days ago" />
          <Activity title="Report analyzed by AI" time="5 days ago" />
          <Activity title="Profile updated" time="1 week ago" />
        </div>

      </CardContent>
    </Card>
  );
}

/* helpers */

function Step({ icon, label, active }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          active ? "bg-red-600 text-white" : "bg-gray-200"
        }`}
      >
        {icon}
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function Line({ active }: any) {
  return (
    <div className={`flex-1 h-[2px] ${active ? "bg-red-600" : "bg-gray-300"}`} />
  );
}

function Activity({ title, time }: any) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <FileText className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
