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
    const { emergencyId, mode } = await req.json();

    if (!emergencyId) {
      return new Response(
        JSON.stringify({ error: "Emergency ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update emergency with new OTP
    const { data: emergency, error: updateError } = await supabase
      .from("emergencies")
      .update({ verification_otp: newOtp })
      .eq("id", emergencyId)
      .select("patient_phone, patient_id")
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to generate new OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log OTP resend
    await supabase.from("audit_logs").insert({
      entity_type: "emergency",
      entity_id: emergencyId,
      action: "otp_resent",
      details: { mode, phone: emergency?.patient_phone?.substring(0, 4) + "****" }
    });

    // In production, send SMS here
    // For now, we just generate and store the OTP
    console.log(`[OTP] New OTP for emergency ${emergencyId}: ${newOtp}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "New OTP generated",
        // Only include OTP in development/demo mode
        ...(Deno.env.get("ENVIRONMENT") !== "production" && { otp: newOtp })
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OTP resend error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to resend OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
