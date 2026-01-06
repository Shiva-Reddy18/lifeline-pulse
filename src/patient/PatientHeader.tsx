import { Activity } from "lucide-react";

const PatientHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-muted-foreground">
          Emergency blood response control center
        </p>
      </div>

      <div className="flex items-center gap-2 text-green-600 font-medium">
        <Activity className="w-4 h-4 animate-pulse" />
        ONLINE
      </div>
    </div>
  );
};

export default PatientHeader;
