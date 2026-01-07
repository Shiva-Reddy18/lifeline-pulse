import { supabase } from "@/integrations/supabase/client";

export async function logAuditAction({
  action,
  entityType,
  entityId,
  performedBy,
}: {
  action: string;
  entityType: "profile" | "request";
  entityId?: string;
  performedBy?: string;
}) {
  await supabase.from("audit_logs").insert([
    {
      action,
      entity_type: entityType,
      entity_id: entityId,
      performed_by: performedBy,
    },
  ]);
}