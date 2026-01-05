import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, Bell } from "lucide-react";

const PatientNotifications = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 font-semibold">
          <Bell className="w-5 h-5" />
          Notifications
        </div>
        <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          No new notifications.
        </div>
      )}
    </Card>
  );
};

export default PatientNotifications;
