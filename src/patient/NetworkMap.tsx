import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Droplet } from "lucide-react";

type EmergencyRequest = {
  id: string;
  latitude: number;
  longitude: number;
  blood_group: string;
  units_required: number;
  status: string;
  patient_name: string;
  patient_phone: string;
  hospital_name: string;
  address: string;
  created_at: string;
};

const NetworkMap = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    const { data, error } = await supabase
      .from("emergency_requests")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching emergency requests:", error);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading nearby emergencies...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No active emergency requests nearby 🚑
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Active Emergency Requests
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((req) => (
          <Card key={req.id} className="border-l-4 border-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplet className="text-red-500" size={18} />
                  {req.blood_group} Required
                </span>

                <Badge variant="destructive">
                  {req.units_required} Units
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">
                Patient: {req.patient_name}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone size={14} />
                {req.patient_phone}
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={14} />
                <span>{req.address}</span>
              </div>

              <div className="text-xs text-muted-foreground">
                Hospital: {req.hospital_name}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NetworkMap;