import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const PatientHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">
        Patient Dashboard
      </h1>

      <Button variant="outline">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default PatientHeader;
