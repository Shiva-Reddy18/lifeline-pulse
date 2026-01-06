import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "../utils/auditLogger";
import { motion } from "framer-motion";

type EmergencyRequest = {
  id: string;
  patient_name: string;
  blood_group: string;
  status: "pending" | "fulfilled" | "flagged";
  created_at: string;
  user_id: string | null;
  profiles: {
    phone: string | null;
    address: string | null;
    full_name: string | null;
  } | null;
};



export function SystemActivity() {
  const queryClient = useQueryClient();

  // 🔹 Fetch emergency requests
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["admin-system-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_requests")
     .select(`
  id,
  patient_name,
  blood_group,
  status,
  created_at,
  user_id,
  profiles (
    full_name,
    phone,
    address
  )
`)


        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmergencyRequest[];
    },
    refetchInterval: 15000, // auto refresh
  });

  // 🔹 Mark request as fulfilled
 const markFulfilled = async (id: string) => {
  const { error } = await supabase
    .from("emergency_requests")
    .update({ status: "fulfilled" })
    .eq("id", id);

  if (!error) {
    await logAuditAction({
      action: "fulfilled_request",
      entityType: "request",
      entityId: id,
    });

    queryClient.invalidateQueries({
      queryKey: ["admin-system-activity"],
    });
    queryClient.invalidateQueries({ queryKey: ["admin-live-stats"] });

  }
};


  // 🔹 Flag request
const flagRequest = async (id: string) => {
  const { error } = await supabase
    .from("emergency_requests")
    .update({ status: "flagged" })
    .eq("id", id);

  if (!error) {
    await logAuditAction({
      action: "flagged_request",
      entityType: "request",
      entityId: id,
    });

    queryClient.invalidateQueries({
      queryKey: ["admin-system-activity"],
    });
    queryClient.invalidateQueries({ queryKey: ["admin-live-stats"] });

  }
};


  // 🔹 Block user (soft block)
  const blockUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", userId);

    if (!error) {
      alert("User blocked successfully");
    }
  };

  // 🔹 Loading state
  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="animate-pulse text-muted-foreground">
  Loading system data…
</p>
        </CardContent>
      </Card>
    );
  }

  // 🔹 Error state
  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load system activity.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 🔹 UI
  return (
    <Card className="
  bg-white/70 backdrop-blur-xl
  border border-white/50
  shadow-xl shadow-black/5
">

     <CardHeader className="
  sticky top-0 z-10
  bg-white/80 backdrop-blur
  border-b
">

        <CardTitle>System Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[420px] overflow-y-auto">

        {requests && requests.length > 0 ? (
  requests.map((req) => {
    

    return (
      <motion.div
      key={req.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
        <div
  className="
          border rounded-2xl p-5 space-y-3
          bg-white/80 backdrop-blur
          shadow-md hover:shadow-xl
          hover:-translate-y-0.5
          transition-all duration-300
        "
      >

  {/* TOP ROW: NAME + STATUS */}
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-lg font-semibold">{req.patient_name}</p>
      <p className="text-sm text-muted-foreground">
        Blood Group: <span className="font-medium">{req.blood_group}</span>
      </p>
    </div>

   <Badge className={`
  capitalize px-3 py-1 text-xs font-semibold
  ${req.status === "fulfilled" && "bg-green-100 text-green-700"}
  ${req.status === "pending" && "bg-yellow-100 text-yellow-700"}
  ${req.status === "flagged" && "bg-red-100 text-red-700"}
`}>
  {req.status}
</Badge>

  </div>

  {/* MIDDLE ROW: CONTACT + LOCATION */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
    <p>
      📞 <span className="font-medium">Phone:</span>{" "}
      {req.phone ?? "Not provided"}
    </p>
    <p>
      📍 <span className="font-medium">Location:</span>{" "}
      {req.address ?? "Not provided"}
    </p>
  </div>

  {/* BOTTOM ROW: TIME + ACTIONS */}
  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
    <p className="text-xs text-muted-foreground">
      Requested at: {new Date(req.created_at).toLocaleString()}
    </p>

    <div className="flex gap-2">
      {req.status === "pending" && (
        <>
          <Button  className="
  bg-gradient-to-r from-red-500 to-pink-500
  hover:from-red-600 hover:to-pink-600
  shadow-md shadow-red-200
" size="sm" onClick={() => markFulfilled(req.id)}>
            Fulfill
          </Button>
          <Button className="
  bg-red-500 hover:bg-red-600
  shadow-md shadow-red-200"
            size="sm"
            variant="destructive"
            onClick={() => flagRequest(req.id)}
          >
            Flag
          </Button>
        </>
      )}

      {req.status === "flagged" && req.user_id && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => blockUser(req.user_id)}
        >
          Block User
        </Button>
      )}
    </div>
  </div>
</div>
</motion.div>

    );
  })
) : (


          <p className="text-sm text-muted-foreground">
            No emergency requests found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
