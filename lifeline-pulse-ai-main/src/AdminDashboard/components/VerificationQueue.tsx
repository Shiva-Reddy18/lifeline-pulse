import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "../utils/auditLogger";
import { motion } from "framer-motion";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_role: string;
  is_verified: boolean;
  created_at: string;
};

export function VerificationQueue() {
  const queryClient = useQueryClient();

  // 🔹 Fetch unverified profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["verification-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, primary_role, is_verified, created_at"
        )
        .eq("is_verified", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // 🔹 Approve profile
 const approveProfile = async (id: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", id);

  if (!error) {
    // 🧾 AUDIT LOG
    await logAuditAction({
      action: "approved_profile",
      entityType: "profile",
      entityId: id,
    });

    queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
    queryClient.invalidateQueries({ queryKey: ["admin-live-stats"] });

  }
};


  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading verification requests...</p>
        </CardContent>
      </Card>
    );
  }

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

        <CardTitle>Verification Queue</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[420px] overflow-y-auto">

        {profiles && profiles.length > 0 ? (
          profiles.map((profile) => (
             <motion.div
    key={profile.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
          <div
  
  className="border rounded-xl p-4 space-y-3 hover:bg-muted/40 transition"
>
  {/* TOP: NAME + ROLE */}
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-lg font-semibold">{profile.full_name}</p>
      <p className="text-sm text-muted-foreground">
        Role:{" "}
        <span className="capitalize font-medium">
          {profile.primary_role}
        </span>
      </p>
    </div>

    <Badge className="capitalize">
      {profile.primary_role}
    </Badge>
  </div>

  {/* MIDDLE: CONTACT + ADDRESS */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
    <p>
      📞 <span className="font-medium">Phone:</span>{" "}
      {profile.phone || "Not provided"}
    </p>
    <p>
      📍 <span className="font-medium">Address:</span>{" "}
      {profile.address || "Not provided"}
    </p>
  </div>

  {/* BOTTOM: TIME + ACTIONS */}
  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
    <p className="text-xs text-muted-foreground">
      Registered at:{" "}
      {new Date(profile.created_at).toLocaleString()}
    </p>

    <div className="flex gap-2">
      <Button  className="
  bg-gradient-to-r from-red-500 to-pink-500
  hover:from-red-600 hover:to-pink-600
  shadow-md shadow-red-200
" size="sm" onClick={() => approveProfile(profile.id)}>
        Approve
      </Button>

      <Button size="sm" variant="outline" disabled>
        Reject
      </Button>
    </div>
  </div>
</div>
</motion.div>

          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No pending verification requests 🎉
          </p>
        )}
      </CardContent>
    </Card>
  );
}
