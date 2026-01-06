import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface BloodRequest {
  _id: string;
  patientName: string;
  bloodGroup: string;
  hospitalName: string;
  hospitalLocation: string;
  status: "PENDING" | "APPROVED" | "COMPLETED";
}

export default function DonorDashboard() {
  const { toast } = useToast();

  // 🔴 Replace with auth context value later
  const donorId = localStorage.getItem("userId");

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch emergency requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/donor/alerts/${donorId}`
      );

      if (res.data.message) {
        setRequests([]);
        toast({
          title: "Info",
          description: res.data.message
        });
      } else {
        setRequests(res.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load donor alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 🔹 Accept request
  const acceptRequest = async (id: string) => {
    await axios.post(
      `http://localhost:5000/donor/accept/${id}/${donorId}`
    );
    toast({ title: "Request accepted" });
    fetchRequests();
  };

  // 🔹 Reject request
  const rejectRequest = async (id: string) => {
    await axios.post(`http://localhost:5000/donor/reject/${id}`);
    toast({ title: "Request rejected" });
    fetchRequests();
  };

  // 🔹 Complete donation
  const completeDonation = async (id: string) => {
    await axios.post(
      `http://localhost:5000/donor/complete/${id}/${donorId}`
    );
    toast({ title: "Donation completed ❤️" });
    fetchRequests();
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        ❤️ Donor Dashboard
      </h1>

      {requests.length === 0 && (
        <p className="text-muted-foreground">
          No emergency requests right now
        </p>
      )}

      <div className="grid gap-4">
        {requests.map((req) => (
          <Card key={req._id}>
            <CardContent className="space-y-2 p-4">
              <h2 className="font-semibold">
                Patient: {req.patientName}
              </h2>

              <p>Blood Group: {req.bloodGroup}</p>

              {req.status !== "PENDING" && (
                <>
                  <p>Hospital: {req.hospitalName}</p>
                  <p>Location: {req.hospitalLocation}</p>
                </>
              )}

              <div className="flex gap-2 pt-2">
                {req.status === "PENDING" && (
                  <>
                    <Button onClick={() => acceptRequest(req._id)}>
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectRequest(req._id)}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {req.status === "APPROVED" && (
                  <Button
                    variant="destructive"
                    onClick={() => completeDonation(req._id)}
                  >
                    Mark Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
