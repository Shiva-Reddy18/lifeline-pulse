import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PatientInfoCard() {
  return (
    <Card className="min-h-[320px] flex flex-col justify-center px-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            ✨
          </div>
          <h2 className="text-xl font-semibold">AI Health Assistant</h2>
        </div>

        <p className="text-sm text-muted-foreground max-w-md">
          Upload your medical reports for instant AI-powered analysis and
          recommendations.
        </p>

        <Button
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50 w-fit"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Report
        </Button>
      </div>
    </Card>
  );
}