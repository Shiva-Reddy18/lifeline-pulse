import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

const RequestHistory = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-semibold">Request History</h3>
        <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          No previous requests found.
        </div>
      )}
    </Card>
  );
};

export default RequestHistory;
