import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `You are a medical report analyzer for an emergency blood response system.

Analyze the provided medical report text/image and extract:
1. Platelet count (normal: 150,000-400,000 per µL)
2. Hemoglobin level (normal: 12-17 g/dL for adults)
3. Blood group if mentioned
4. Any critical values that indicate emergency

Respond in JSON format:
{
  "platelets": number or null,
  "hemoglobin": number or null,
  "blood_group": "A+/A-/B+/B-/AB+/AB-/O+/O-" or null,
  "is_critical": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "summary": "Brief 1-2 sentence summary",
  "recommendations": ["array", "of", "recommendations"]
}

Critical thresholds:
- Platelets < 50,000: Critical
- Platelets < 100,000: High severity
- Hemoglobin < 7 g/dL: Critical
- Hemoglobin < 10 g/dL: High severity

Be accurate and only extract what's clearly stated.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { report_text, report_image_base64 } = await req.json();

    if (!report_text && !report_image_base64) {
      return new Response(JSON.stringify({ error: "Provide report_text or report_image_base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Analyzing medical report...");

    const messages: any[] = [
      { role: "system", content: ANALYSIS_PROMPT }
    ];

    if (report_image_base64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analyze this medical report:" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${report_image_base64}` } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this medical report:\n\n${report_text}`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    console.log("Report analysis complete:", analysis.severity);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analyze report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
