import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type History = {
  id: string;
  created_at: string;
  blood_group: string;
  status: string;
  hospital: {
    full_name: string;
  } | null;
};

export default function RequestHistory() {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("emergency_requests")
        .select(`
          id,
          created_at,
          blood_group,
          status,
          hospital:profiles(full_name)
        `)
        .eq("patient_id", user.id)
        .in("status", ["fulfilled", "rejected", "cancelled"])
        .order("created_at", { ascending: false });

      setHistory(data || []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Loading history…
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request History</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No completed emergency requests yet.
          </p>
        )}

        {history.map((req) => (
          <div
            key={req.id}
            className="flex justify-between items-center border-b pb-3"
          >
            <div>
              <p className="font-medium">
                {req.blood_group} Emergency
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(req.created_at).toLocaleString()}
              </p>
              <p className="text-xs">
                Hospital: {req.hospital?.full_name || "—"}
              </p>
            </div>

            <Badge
              className={
                req.status === "fulfilled"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {req.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
