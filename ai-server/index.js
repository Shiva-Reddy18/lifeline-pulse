require("dotenv").config();
const express = require("express");
const { fetch } = require("undici");

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

console.log("🔥 LIFELINE-X AI SERVER STARTED");
console.log("🔑 ENV KEY:", process.env.OPENAI_API_KEY ? "LOADED ✅" : "MISSING ❌");

// 🚨 Emergency keywords
const EMERGENCY_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "unconscious",
  "heart attack",
  "severe bleeding",
  "not breathing",
  "stroke",
  "seizure",
];

// 🧠 SYSTEM PROMPT (THIS IS THE SOUL)
const SYSTEM_PROMPT = `
You are LIFELINE-X, an advanced emergency health assistant.

RULES:
- Always focus on health-related guidance
- Be calm, clear, and supportive
- NEVER give definitive diagnosis
- Always suggest seeing a doctor if symptoms are serious
- If symptoms indicate emergency, clearly warn the user

FORMAT RESPONSES LIKE THIS WHEN SYMPTOMS ARE GIVEN:

🩺 Possible Causes:
• ...

⚠️ Severity Level:
Low / Medium / High / Emergency

✅ What You Can Do Now:
• ...

🚨 When To Seek Immediate Help:
• ...

If the user just greets (hi, hello), introduce yourself briefly and ask for symptoms.
`;

app.post("/chat", async (req, res) => {
  try {
    let messages = req.body.messages;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // 🔍 Emergency detection
    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    const isEmergency = EMERGENCY_KEYWORDS.some((word) =>
      lastUserMessage.includes(word)
    );

    // Inject system prompt ONCE
    if (!messages.some((m) => m.role === "system")) {
      messages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: messages,
      }),
    });

    const data = await response.json();

    let reply =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "I'm unable to respond right now.";

    // 🚨 HARD EMERGENCY OVERRIDE
    if (isEmergency) {
      reply =
        "🚨 **EMERGENCY DETECTED** 🚨\n\n" +
        "Your symptoms may indicate a life-threatening condition.\n\n" +
        "❗ Please press the **EMERGENCY BUTTON** immediately or contact local emergency services.\n\n" +
        "Do NOT delay.";
    }

    res.json({
      choices: [
        {
          message: {
            content: reply,
          },
        },
      ],
    });
  } catch (err) {
    console.error("❌ AI ERROR:", err);
    res.status(500).json({ error: "AI server failed" });
  }
});

app.listen(5050, () => {
  console.log("🚀 Running at http://localhost:5050");
});
