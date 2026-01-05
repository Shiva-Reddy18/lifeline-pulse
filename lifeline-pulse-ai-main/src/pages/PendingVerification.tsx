import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PendingVerification() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <CardTitle>Verification Pending</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Your registration has been received and is currently under review
            by the admin team.
          </p>
          <p className="mt-3">
            You will get access once your organization is verified.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
