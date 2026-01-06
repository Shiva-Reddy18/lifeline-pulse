import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
};

export function AuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      return data as AuditLog[];
    },
  });

  if (isLoading) return null;

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


        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">

        {data?.map((log) => (
         <div
  key={log.id}
  className="border-l-4 border-primary pl-4 py-2 rounded bg-muted/40"
>
  <p className="font-medium capitalize">{log.action.replace("_", " ")}</p>
  <p className="text-xs text-muted-foreground">
    {log.entity_type} • {new Date(log.created_at).toLocaleString()}
  </p>
</div>

        ))}
      </CardContent>
    </Card>
  );
}
