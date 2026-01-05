import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PatientNotifications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p>🩸 Donor accepted your request</p>
        <p>✅ Blood request approved</p>
        <p>⏰ Please check hospital confirmation</p>
      </CardContent>
    </Card>
  );
};

export default PatientNotifications;
