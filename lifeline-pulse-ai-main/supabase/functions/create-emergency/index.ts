import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed blood groups - validation whitelist
const ALLOWED_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ALLOWED_CONDITIONS = ["trauma", "surgery", "dengue", "other"];
const MAX_UNITS = 10;
const MAX_COORDINATE = 180;

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation
function validateInput(data: any): { valid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  // Blood group validation
  if (!data.bloodGroup || !ALLOWED_BLOOD_GROUPS.includes(data.bloodGroup)) {
    if (data.bloodGroup) {
      errors.push(`Invalid blood group: ${data.bloodGroup}`);
    }
    sanitized.bloodGroup = "O+"; // Default to most common
  } else {
    sanitized.bloodGroup = data.bloodGroup;
  }

  // Units validation
  const units = parseInt(data.unitsRequired) || 1;
  if (units < 1 || units > MAX_UNITS) {
    sanitized.unitsRequired = Math.min(Math.max(units, 1), MAX_UNITS);
    if (units > MAX_UNITS) {
      errors.push(`Units capped at ${MAX_UNITS}`);
    }
  } else {
    sanitized.unitsRequired = units;
  }

  // Condition validation
  if (!data.condition || !ALLOWED_CONDITIONS.includes(data.condition)) {
    sanitized.condition = "other";
    if (data.condition) {
      errors.push(`Invalid condition type: ${data.condition}`);
    }
  } else {
    sanitized.condition = data.condition;
  }

  // Location validation
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  
  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > MAX_COORDINATE) {
    errors.push("Invalid coordinates");
    // Use default location (can be updated later)
    sanitized.latitude = 0;
    sanitized.longitude = 0;
  } else {
    sanitized.latitude = lat;
    sanitized.longitude = lng;
  }

  // Patient name sanitization (prevent injection)
  sanitized.patientName = String(data.patientName || "Anonymous")
    .replace(/[<>\"\'\\]/g, "")
    .substring(0, 100);

  // Phone sanitization
  sanitized.patientPhone = data.patientPhone 
    ? String(data.patientPhone).replace(/[^\d+\-\s]/g, "").substring(0, 20)
    : null;

  // Address sanitization
  sanitized.address = data.address
    ? String(data.address).replace(/[<>\"\'\\]/g, "").substring(0, 500)
    : null;

  // Offline ID for sync
  sanitized.offlineId = data.offlineId || null;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please wait before creating another emergency.",
          retryAfter: 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    const requestData = await req.json();
    
    // Validate and sanitize input
    const { valid, errors, sanitized } = validateInput(requestData);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header if available
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Generate OTP for verification
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create emergency record
    const { data: emergency, error: insertError } = await supabase
      .from("emergencies")
      .insert({
        patient_id: userId,
        blood_group: sanitized.bloodGroup,
        units_required: sanitized.unitsRequired,
        condition: sanitized.condition,
        location_lat: sanitized.latitude,
        location_lng: sanitized.longitude,
        location_address: sanitized.address,
        patient_name: sanitized.patientName,
        patient_phone: sanitized.patientPhone,
        verification_otp: verificationOtp,
        status: "created",
        escalation_level: 0
      })
      .select("id, blood_group, criticality_score, urgency_level, expires_at")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create emergency request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find nearby hospitals (within 50km)
    const { data: hospitals } = await supabase
      .from("hospitals")
      .select("id, name, phone, location_lat, location_lng")
      .eq("is_verified", true)
      .eq("is_active", true);

    // Find compatible donors
    const { data: donors } = await supabase
      .from("donors")
      .select("id, user_id, blood_group, location_lat, location_lng")
      .eq("is_eligible", true)
      .eq("is_active", true)
      .eq("is_blacklisted", false);

    // Log emergency creation in audit
    await supabase.from("audit_logs").insert({
      entity_type: "emergency",
      entity_id: emergency.id,
      action: "emergency_created",
      actor_id: userId,
      ip_address: clientIP,
      details: {
        bloodGroup: sanitized.bloodGroup,
        condition: sanitized.condition,
        validationErrors: errors.length > 0 ? errors : undefined,
        offlineId: sanitized.offlineId
      }
    });

    // In production: Send notifications to hospitals and donors
    console.log(`[Emergency] Created ${emergency.id} - ${sanitized.bloodGroup} - ${sanitized.condition}`);
    console.log(`[OTP] Verification OTP: ${verificationOtp}`);

    return new Response(
      JSON.stringify({
        success: true,
        emergencyId: emergency.id,
        bloodGroup: emergency.blood_group,
        criticalityScore: emergency.criticality_score,
        urgencyLevel: emergency.urgency_level,
        expiresAt: emergency.expires_at,
        nearbyHospitals: hospitals?.length || 0,
        eligibleDonors: donors?.length || 0,
        validationWarnings: errors.length > 0 ? errors : undefined,
        requiresVerification: true,
        // Only include OTP in demo mode
        ...(Deno.env.get("ENVIRONMENT") !== "production" && { otp: verificationOtp })
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Emergency creation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
// Blood compatibility - who can donate to this blood group
function getCompatibleDonorGroups(recipient: string): string[] {
  const compatibility: Record<string, string[]> = {
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
  };
  return compatibility[recipient] || [recipient];
}
