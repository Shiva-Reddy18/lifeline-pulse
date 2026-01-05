import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple encryption for QR payload
function encodePayload(data: Record<string, any>): string {
  const json = JSON.stringify(data);
  return btoa(json); // Base64 encode for QR readability
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emergencyId } = await req.json();

    if (!emergencyId) {
      return new Response(
        JSON.stringify({ error: "Emergency ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get emergency details
    const { data: emergency, error: fetchError } = await supabase
      .from("emergencies")
      .select("id, blood_group, units_required, hospital_id, status, verification_otp")
      .eq("id", emergencyId)
      .single();

    if (fetchError || !emergency) {
      return new Response(
        JSON.stringify({ error: "Emergency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a new handoff OTP if not exists
    let otp = emergency.verification_otp;
    if (!otp) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      await supabase
        .from("emergencies")
        .update({ verification_otp: otp })
        .eq("id", emergencyId);
    }

    // Create QR payload with expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const qrPayload = encodePayload({
      type: "lifeline-x-handoff",
      emergencyId,
      bloodGroup: emergency.blood_group,
      units: emergency.units_required,
      otp, // Include OTP in encrypted payload
      expiresAt: expiresAt.toISOString(),
      signature: btoa(`${emergencyId}-${otp}-${expiresAt.getTime()}`) // Simple signature
    });

    // Log QR generation
    await supabase.from("audit_logs").insert({
      entity_type: "emergency",
      entity_id: emergencyId,
      action: "handoff_qr_generated",
      details: { 
        expiresAt: expiresAt.toISOString(),
        hospitalId: emergency.hospital_id
      }
    });

    return new Response(
      JSON.stringify({ 
        qrPayload,
        expiresAt: expiresAt.toISOString(),
        otp // Also return OTP for manual entry option
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("QR generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate QR code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
