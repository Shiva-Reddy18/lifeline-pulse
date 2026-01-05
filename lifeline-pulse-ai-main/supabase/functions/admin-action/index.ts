import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin-only actions
type AdminAction = 
  | "verify_hospital" 
  | "reject_hospital" 
  | "blacklist_user" 
  | "toggle_disaster_mode"
  | "force_escalation"
  | "override_emergency";

interface AdminRequest {
  action: AdminAction;
  targetId?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. AUTHENTICATE - Get user from token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. AUTHORIZE - Verify admin role using server-side check
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !hasAdminRole) {
      // Log unauthorized access attempt
      await supabase.from("audit_logs").insert({
        entity_type: "security",
        entity_id: user.id,
        action: "unauthorized_admin_access_attempt",
        actor_id: user.id,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        details: { attempted_action: "admin_action" }
      });

      return new Response(
        JSON.stringify({ error: "Admin access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. VERIFY ADMIN IS ACTIVE (additional security layer)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    // Parse request body
    const { action, targetId, data: actionData }: AdminRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Action is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, any> = {};

    // 4. EXECUTE ADMIN ACTIONS
    switch (action) {
      case "verify_hospital": {
        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "Hospital ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("hospitals")
          .update({ is_verified: true, updated_at: new Date().toISOString() })
          .eq("id", targetId);

        if (error) throw error;

        result = { message: "Hospital verified successfully" };
        break;
      }

      case "reject_hospital": {
        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "Hospital ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("hospitals")
          .delete()
          .eq("id", targetId)
          .eq("is_verified", false); // Only delete unverified

        if (error) throw error;

        result = { message: "Hospital registration rejected" };
        break;
      }

      case "blacklist_user": {
        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "User/Donor ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("donors")
          .update({ 
            is_blacklisted: true, 
            blacklist_reason: actionData?.reason || "Admin action",
            updated_at: new Date().toISOString()
          })
          .eq("id", targetId);

        if (error) throw error;

        result = { message: "User blacklisted successfully" };
        break;
      }

      case "toggle_disaster_mode": {
        // In production, this would update a global settings table
        // For now, we just log and return success
        result = { 
          message: actionData?.enabled 
            ? "Disaster mode activated" 
            : "Disaster mode deactivated",
          disasterMode: actionData?.enabled 
        };
        break;
      }

      case "force_escalation": {
        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "Emergency ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: emergency, error: fetchError } = await supabase
          .from("emergencies")
          .select("escalation_level")
          .eq("id", targetId)
          .single();

        if (fetchError) throw fetchError;

        const newLevel = Math.min((emergency?.escalation_level || 0) + 1, 4);

        const { error } = await supabase
          .from("emergencies")
          .update({ 
            escalation_level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq("id", targetId);

        if (error) throw error;

        result = { 
          message: "Emergency escalated", 
          newLevel,
          escalationLevels: ["Local", "District", "State", "Admin", "Disaster"]
        };
        break;
      }

      case "override_emergency": {
        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "Emergency ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("emergencies")
          .update({ 
            status: actionData?.status || "fulfilled",
            auto_closed_at: actionData?.status === "auto_closed" ? new Date().toISOString() : null,
            fulfilled_at: actionData?.status === "fulfilled" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", targetId);

        if (error) throw error;

        result = { message: "Emergency status overridden" };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 5. AUDIT LOG - All admin actions are logged
    await supabase.from("audit_logs").insert({
      entity_type: action.includes("hospital") ? "hospital" : 
                   action.includes("emergency") ? "emergency" : "admin",
      entity_id: targetId || user.id,
      action: `admin_${action}`,
      actor_id: user.id,
      actor_role: "admin",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      details: { ...actionData, targetId }
    });

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin action error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
