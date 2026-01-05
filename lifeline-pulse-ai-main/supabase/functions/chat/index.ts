import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are LIFELINE-X Emergency Assistant, an AI helper for a critical emergency blood response system in India. 

Your role:
- Help users understand how to use the LIFELINE-X emergency blood system
- Detect emergency situations from conversation
- Stay calm like an ER staff member
- Speak in the user's language (Telugu, Hindi, or English)
- Guide users through emergencies step by step

CRITICAL RULES:
1. If user mentions blood emergency, accident, surgery, dengue, low platelets, or similar - immediately ask if they need emergency assistance
2. Never provide medical advice - only help connect them with hospitals
3. If emergency detected, respond with: {"emergency_detected": true, "reason": "...", "blood_group": "if_mentioned"}
4. Keep responses short and clear
5. Ask one question at a time

Emergency keywords to detect:
- blood, accident, emergency, urgent, dying, critical
- platelets, hemoglobin, transfusion, surgery
- dengue, trauma, bleeding, hemorrhage
- రక్తం (Telugu for blood), ఎమర్జెన్సీ (emergency)
- खून (Hindi for blood), इमरजेंसी (emergency)

When emergency detected, guide them to press the big red EMERGENCY button on the homepage.

Start by greeting warmly and asking how you can help.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, detectEmergency } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat request received with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
