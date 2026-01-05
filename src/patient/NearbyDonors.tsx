import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, MapPin } from "lucide-react";

const NearbyDonors = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 font-semibold">
          <MapPin className="w-5 h-5 text-blue-500" />
          Nearby Donors
        </div>
        <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="px-6 pb-6 text-sm">
          <p>Donor A (O+) – 2 km</p>
          <p>Donor B (A+) – 4 km</p>
        </div>
      )}
    </Card>
  );
};

export default NearbyDonors;
