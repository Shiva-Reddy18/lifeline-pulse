import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, MapPin, Phone } from "lucide-react";

const PatientInfoCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-red-500" />
          <span>Blood Group: <b>O+</b></span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span>Location: Ongole</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-500" />
          <span>Emergency Contact: 9XXXXXXXXX</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
