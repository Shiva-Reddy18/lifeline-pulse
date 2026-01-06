import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emergencyId, otp, mode } = await req.json();

    // Input validation
    if (!emergencyId || !otp) {
      return new Response(
        JSON.stringify({ error: "Emergency ID and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get emergency with OTP
    const { data: emergency, error: fetchError } = await supabase
      .from("emergencies")
      .select("id, verification_otp, status, patient_id")
      .eq("id", emergencyId)
      .single();

    if (fetchError || !emergency) {
      return new Response(
        JSON.stringify({ error: "Emergency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    if (emergency.verification_otp !== otp) {
      // Log failed attempt
      await supabase.from("audit_logs").insert({
        entity_type: "emergency",
        entity_id: emergencyId,
        action: "otp_verification_failed",
        details: { mode, attempted_otp: otp.substring(0, 2) + "****" }
      });

      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update emergency status based on mode
    let updateData: Record<string, any> = {};
    
    if (mode === "emergency") {
      updateData = {
        status: "hospital_verified",
        updated_at: new Date().toISOString()
      };
    } else if (mode === "handoff") {
      updateData = {
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
        verification_otp: null // Clear OTP after successful handoff
      };
    }

    const { error: updateError } = await supabase
      .from("emergencies")
      .update(updateData)
      .eq("id", emergencyId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update emergency status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful verification
    await supabase.from("audit_logs").insert({
      entity_type: "emergency",
      entity_id: emergencyId,
      action: mode === "handoff" ? "blood_handoff_verified" : "otp_verified",
      details: { mode, verified_at: new Date().toISOString() }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: mode === "handoff" 
          ? "Blood handoff verified successfully" 
          : "Emergency verified successfully",
        newStatus: updateData.status
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
