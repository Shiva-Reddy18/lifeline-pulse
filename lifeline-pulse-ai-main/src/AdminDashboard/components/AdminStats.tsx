import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-stats"],
    queryFn: async () => {
      // Total requests
      const { count: totalRequests } = await supabase
        .from("emergency_requests")
        .select("*", { count: "exact", head: true });

      // Pending
      const { count: pendingRequests } = await supabase
        .from("emergency_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fulfilled
      const { count: fulfilledRequests } = await supabase
        .from("emergency_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "fulfilled");

      // Flagged
      const { count: flaggedRequests } = await supabase
        .from("emergency_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "flagged");

      // Unverified profiles
      const { count: unverifiedProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", false);

      return {
        totalRequests: totalRequests ?? 0,
        pendingRequests: pendingRequests ?? 0,
        fulfilledRequests: fulfilledRequests ?? 0,
        flaggedRequests: flaggedRequests ?? 0,
        unverifiedProfiles: unverifiedProfiles ?? 0,
      };
    },
    refetchInterval: 15000, // 🔄 auto refresh every 15 sec
  });

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <StatCard title="Total Requests" value={data.totalRequests} />
      <StatCard title="Pending" value={data.pendingRequests} />
      <StatCard title="Fulfilled" value={data.fulfilledRequests} />
      <StatCard title="Flagged" value={data.flaggedRequests} />
      <StatCard title="Unverified Users" value={data.unverifiedProfiles} />
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <Card className="
  relative overflow-hidden
  bg-white/60 backdrop-blur-xl
  border border-white/40
  shadow-lg shadow-red-100/40
  hover:shadow-xl hover:scale-[1.02]
  transition-all duration-300
">

      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>

      {/* Decorative gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1 
  bg-gradient-to-r from-red-500 via-pink-500 to-blue-500" />


    </Card>
  );
}

