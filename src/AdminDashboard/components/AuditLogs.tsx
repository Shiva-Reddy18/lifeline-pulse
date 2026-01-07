import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  UserX,
  Info,
} from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
};

const getStyle = (action: string) => {
  if (action.includes("fulfilled"))
    return {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bg: "from-green-400/20 to-green-100",
      ring: "ring-green-400/40",
    };

  if (action.includes("flagged"))
    return {
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      bg: "from-orange-400/20 to-orange-100",
      ring: "ring-orange-400/40",
    };

  if (action.includes("blocked"))
    return {
      icon: <UserX className="w-6 h-6 text-red-600" />,
      bg: "from-red-400/20 to-red-100",
      ring: "ring-red-400/40",
    };

  return {
    icon: <Info className="w-6 h-6 text-blue-600" />,
    bg: "from-blue-400/20 to-blue-100",
    ring: "ring-blue-400/40",
  };
};

export function AuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  return (
    <Card className="
      bg-gradient-to-br from-red-50 via-white to-blue-50
      border border-white/60
      shadow-2xl shadow-red-200/30
    ">
      <CardHeader>
        <CardTitle className="
          text-2xl font-extrabold tracking-tight
          bg-gradient-to-r from-red-600 to-pink-600
          bg-clip-text text-transparent
        ">
          🔍 Audit Intelligence Feed
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live security & activity timeline
        </p>
      </CardHeader>

      <CardContent className="max-h-[380px] overflow-y-auto space-y-4">
        {isLoading ? (
          <p className="animate-pulse text-muted-foreground">
            Loading audit intelligence…
          </p>
        ) : logs && logs.length > 0 ? (
          logs.map((log, index) => {
            const style = getStyle(log.action);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ scale: 1.02 }}
                className={`
                  relative overflow-hidden rounded-2xl p-4
                  bg-gradient-to-r ${style.bg}
                  ring-1 ${style.ring}
                  shadow-lg
                `}
              >
                {/* Glow pulse */}
                <div className="
                  absolute inset-0 opacity-0 hover:opacity-100
                  transition
                  bg-gradient-to-r from-white/10 to-transparent
                " />

                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="
                    flex items-center justify-center
                    w-12 h-12 rounded-full
                    bg-white shadow-md
                  ">
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="font-semibold capitalize text-gray-800">
                      {log.action.replaceAll("_", " ")}
                    </p>

                    <p className="text-xs text-gray-600">
                      {log.entity_type.toUpperCase()}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-sm">
            No audit activity recorded yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}