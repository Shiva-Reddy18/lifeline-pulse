import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  Heart,
  Bot,
  User,
  AlertTriangle,
  Download,
  Upload,
  Loader2,
  Trash2,
  FileText,
  Zap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

/* Try to import external helpers if your project has them.
   Keep checks so missing helpers won't break runtime. */
import {
  analyzeHealthSymptoms as externalAnalyze,
  generateHealthResponse as externalGenerate,
  isEmergencySituation as externalIsEmergency,
  loadExternalHealthData as externalLoadData,
} from "@/lib/healthChatbot";

/* ----------------------------- TYPES --------------------------------- */

type Role = "user" | "assistant" | "system";
type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  meta?: Record<string, any>;
};

type SeverityLevel = "low" | "medium" | "high" | "emergency" | "unknown";

type StructuredResponse = {
  possibleCauses?: string[];
  severity?: SeverityLevel;
  immediateActions?: string[];
  whenToSeekHelp?: string[];
  raw?: string;
};

type SymptomRecord = {
  text: string;
  firstMentionAt: number;
};

type UploadSummary = {
  name: string;
  size: number;
  type: string;
  preview?: string; // data URL (image) or empty for pdf
};

/* ---------------------------- CONFIG -------------------------------- */

const BACKEND_CHAT = "http://localhost:5050/chat";

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "not breathing",
  "severe bleeding",
  "unconscious",
  "fainting",
  "blackout",
  "heart attack",
  "stroke",
  "seizure",
  "collapse",
  "sudden weakness",
  "unable to breathe",
  "cant breathe",
  "can't breathe",
];

const SYSTEM_PROMPT = `
You are LIFELINE-X, an emergency-aware health assistant. Follow rules:
- Prioritize user safety. If symptoms indicate emergency, instruct the user to seek immediate professional help.
- Provide structured medical guidance in a safe, conservative way.
- Do NOT give definitive diagnoses. Use "possible causes" language only.
- Use clear, short steps for immediate actions.
- Keep tone calm and non-alarming unless it's an emergency.
`;

/* -------------------------- UTIL HELPERS ------------------------------ */

const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

const now = () => Date.now();

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function normalizeText(s?: string) {
  return (s || "").toString().trim();
}

/* Simple severity estimator from text — fallback logic */
function estimateSeverityFromText(text: string): SeverityLevel {
  if (!text) return "unknown";
  const t = text.toLowerCase();
  if (EMERGENCY_KEYWORDS.some((k) => t.includes(k))) return "emergency";
  const high = ["severe", "intense", "very bad", "unbearable", "worse", "worsening", "violent"];
  const medium = ["moderate", "persistent", "ongoing", "continues", "constant"];
  const low = ["mild", "slight", "a bit", "occasional", "sometimes"];
  if (high.some((s) => t.includes(s))) return "high";
  if (medium.some((s) => t.includes(s))) return "medium";
  if (low.some((s) => t.includes(s))) return "low";
  return "unknown";
}

/* Emergency detection fallback (only checks user text - strict) */
function fallbackIsEmergency(message: string) {
  if (!message) return false;
  const t = message.toLowerCase();
  // check whole words or phrase matches for safety
  return EMERGENCY_KEYWORDS.some((w) => t.includes(w));
}

/* Simple parser to extract short symptom list from user text */
function extractSymptomsFromText(text: string): string[] {
  if (!text) return [];
  const separators = /,|and|\/|\band\b|\bor\b/gi;
  const pieces = text.split(separators).map((p) => p.trim()).filter(Boolean);
  // drop very short words
  return pieces.filter((p) => p.length > 2).slice(0, 8);
}

/* Basic structured generator fallback: returns short StructuredResponse */
function fallbackGenerateStructuredResponse(userInput: string): StructuredResponse {
  const severity = estimateSeverityFromText(userInput);
  const causes = [
    `Viral infection (common)`,
    `Dehydration or heat-related illness`,
    `Cardiac or respiratory condition (if severe symptoms)`,
  ];
  const actions =
    severity === "emergency"
      ? ["Call emergency services now", "If possible, lie down and stay calm", "Do not give anything by mouth to someone unconscious"]
      : [
          "Rest and hydrate",
          "Take antipyretic for high fever (if appropriate)",
          "Monitor symptoms for 24-48 hours",
          "Seek medical care if worsening",
        ];
  const when =
    severity === "low"
      ? ["If symptoms persist > 72 hours, consult a doctor"]
      : severity === "medium"
      ? ["If symptoms worsen or new symptoms appear, seek care within 24 hours"]
      : severity === "high"
      ? ["See emergency department or call emergency services right away"]
      : ["If unsure, contact a healthcare professional."];

  return {
    possibleCauses: causes,
    severity,
    immediateActions: actions,
    whenToSeekHelp: when,
    raw: `Auto-generated guidance for: ${userInput}`,
  };
}

/* attempt to parse a structured response from AI raw text (naive) */
function parseStructuredFromText(raw: string): StructuredResponse {
  const lower = (raw || "").toLowerCase();
  const getListAfter = (label: string) => {
    const idx = lower.indexOf(label.toLowerCase());
    if (idx === -1) return undefined;
    const after = raw.slice(idx + label.length);
    const lines = after.split("\n").map((l) => l.trim()).filter(Boolean);
    const bullets = lines.filter((l) => l.startsWith("•") || l.startsWith("-") || l.match(/^\d+\./));
    if (bullets.length) return bullets.map((b) => b.replace(/^[-•\d\.\s]+/, "").trim());
    return lines.slice(0, 4);
  };
  const possibleCauses = getListAfter("Possible Causes:") || getListAfter("Possible causes:") || undefined;
  const immediateActions = getListAfter("What You Can Do Now:") || getListAfter("Immediate Actions:") || undefined;
  const when = getListAfter("When To Seek Immediate Help:") || getListAfter("When to seek help:") || undefined;
  const severity = lower.includes("emergency") ? "emergency" : lower.includes("high") ? "high" : undefined;
  return {
    possibleCauses,
    immediateActions,
    whenToSeekHelp: when,
    severity: (severity as SeverityLevel) || undefined,
    raw,
  };
}

/* Utility to convert SeverityLevel -> meter percent & label color */
function severityToPercent(level: SeverityLevel) {
  switch (level) {
    case "low":
      return { pct: 25, color: "bg-green-500", label: "Low" };
    case "medium":
      return { pct: 55, color: "bg-yellow-500", label: "Medium" };
    case "high":
      return { pct: 80, color: "bg-orange-600", label: "High" };
    case "emergency":
      return { pct: 100, color: "bg-red-600", label: "Emergency" };
    default:
      return { pct: 10, color: "bg-gray-400", label: "Unknown" };
  }
}

/* --------------------------- CHAT ENGINE ------------------------------ */

/**
 * callAI: calls your local backend at BACKEND_CHAT.
 * Expects payload { messages: Message[] } where messages are objects with role & content.
 * Normalizes backend response into a simple string reply.
 */
async function callAI(messages: { role: Role; content: string }[]): Promise<string> {
  const payload = { messages };
  const res = await fetch(BACKEND_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI backend error: ${res.status} ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.output_text ??
    data?.output?.[0]?.content?.[0]?.text ??
    data?.message ??
    JSON.stringify(data).slice(0, 1000);
  return content;
}

/* ------------------------- COMPONENT START ---------------------------- */

export function Chatbot() {
  const navigate = useNavigate();
  const id = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]);
  const [structuredLast, setStructuredLast] = useState<StructuredResponse | null>(null);
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [voiceActive, setVoiceActive] = useState(false);
  const [transcriptExport, setTranscriptExport] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"auto" | "forced-ai" | "rules-only">("auto");
  const [showDebug, setShowDebug] = useState(false);
  const [loadingHint, setLoadingHint] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const speechRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  /* --------------------- lifecycle: lock body scroll when open ------------------ */
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  /* --------------------- lifecycle: scroll to bottom (with slight delay) ------------------ */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch (e) {
        // ignore
      }
    }, 80);
    return () => clearTimeout(t);
  }, [messages]);

  /* ------------------ initial greeting (once only) ------------------- */
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: uid("m_"),
        role: "assistant",
        content:
          "🩸 Hello! I'm the LIFELINE-X Health Assistant. Describe your symptoms and I'll help you understand what to do next.\n\nIf this is an emergency (chest pain, not breathing, severe bleeding) use the Quick Emergency button or call local services.",
        timestamp: now(),
      };
      setMessages([greeting]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ------------------ try to load external health data (non-blocking)  */
  useEffect(() => {
    (async () => {
      try {
        if (typeof externalLoadData === "function") {
          await externalLoadData();
        }
      } catch (err) {
        // non-fatal
        console.warn("No external health data or failed to load", err);
      }
    })();
  }, []);

  /* --------------------- speech recognition setup -------------------- */
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || undefined;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const sr = new SpeechRecognition();
      sr.lang = "en-IN";
      sr.interimResults = false;
      sr.onresult = (evt: any) => {
        const text = Array.from(evt.results).map((r: any) => r[0].transcript).join(" ");
        setInput((prev) => (prev ? prev + " " + text : text));
      };
      sr.onerror = (e: any) => {
        console.warn("Speech error", e);
      };
      speechRef.current = sr;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  /* ------------------------- helpers: append message ----------------- */
  const appendMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const m: Message = {
      ...msg,
      id: uid("m_"),
      timestamp: now(),
    };
    setMessages((prev) => [...prev, m]);
    return m;
  }, []);

  /* -------------------- conversation memory: add symptom ------------- */
  const recordSymptoms = useCallback((text: string) => {
    const found = extractSymptomsFromText(text);
    if (!found.length) return;
    setSymptomRecords((prev) => {
      const nowTs = now();
      const copy = [...prev];
      found.forEach((s) => {
        if (!copy.find((r) => r.text.toLowerCase() === s.toLowerCase())) {
          copy.push({ text: s, firstMentionAt: nowTs });
        }
      });
      return copy;
    });
  }, []);

  /* -------------------------- upload handling ------------------------ */
  const handleUpload = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = typeof e.target?.result === "string" ? e.target?.result : undefined;
      const summary: UploadSummary = {
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith("image/") ? dataUrl : undefined,
      };
      setUploads((prev) => [...prev, summary]);

      // Demo-analysis: produce an immediate friendly summary for judges
      const demoAnalysis = [
        "📄 Medical Report Analyzed (Demo)",
        `• File: ${file.name}`,
        `• Size: ${Math.round(file.size / 1024)} KB`,
        "",
        "Key Findings (demo):",
        "• Hemoglobin: LOW",
        "• WBC: ELEVATED",
        "• Platelets: WITHIN NORMAL RANGE",
        "",
        "What this might mean (demo):",
        "• Your body may be fighting an infection.",
        "• Fatigue and fever are commonly associated.",
        "",
        "Recommended (demo):",
        "• Stay hydrated and rest.",
        "• If fever persists > 48 hours, consult a healthcare professional.",
        "",
        "If you'd like, ask: 'Explain values' or 'What should I do next?'",
      ].join("\n");

      appendMessage({ role: "assistant", content: demoAnalysis });

      // Optionally: send the demo summary to the AI backend so the AI can consider it in follow-ups
      (async () => {
        try {
          const payloadMessages: { role: Role; content: string }[] = [
            { role: "system", content: SYSTEM_PROMPT.trim() },
            { role: "user", content: `Patient uploaded a report named ${file.name}. Extracted summary:\n\n${demoAnalysis}` },
          ];
          // call AI asynchronously but do not block UI; show a short hint
          setLoadingHint("Analyzing uploaded report with AI...");
          const aiReply = await callAI(payloadMessages).catch(() => "");
          if (aiReply) {
            // Appending the AI's commentary as assistant but not re-running emergency detection on it
            appendMessage({ role: "assistant", content: `AI Analysis (report):\n${aiReply}` });
          }
        } catch (err) {
          // ignore
        } finally {
          setLoadingHint(null);
        }
      })();
    };

    if (file.type.startsWith("image/")) reader.readAsDataURL(file);
    else reader.readAsArrayBuffer(file);
  };

  /* ------------------------ emergency handler ----------------------- */
  const handleEmergency = useCallback(() => {
    setIsEmergencyMode(true);
    appendMessage({
      role: "assistant",
      content:
        "🚨 EMERGENCY MODE ACTIVATED\n\nYour actions:\n1) Call local emergency services now.\n2) If someone nearby, ask for help.\n3) Try to stay still and keep airway open.\n\nIf you want immediate navigation to a nearby hospital, ask me and I'll provide directions.",
    });
    // keep the chat open; clear emergency mode after a short period (banner visible)
    setTimeout(() => {
      setIsEmergencyMode(false);
    }, 6000);
  }, [appendMessage]);

  /* ------------------------ AI or rule decision ---------------------- */
  async function processUserMessage(userText: string) {
    // Always run emergency detection ONLY on the raw user input (strict)
    const emergencyDetected = (typeof externalIsEmergency === "function"
      ? tryExternalIsEmergency(userText)
      : fallbackIsEmergency(userText)) as boolean;

    if (emergencyDetected) {
      appendMessage({
        role: "assistant",
        content:
          "⚠️ Possible emergency detected based on your description. This might be serious. Please call your local emergency services immediately or press Quick Emergency. Do you want me to explain next steps?",
      });
      // Do NOT navigate or lock the UI; let user decide to press Quick Emergency
      return;
    }

    // Local-only mode
    if (aiMode === "rules-only") {
      setLoadingHint("Analyzing locally...");
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 400));
      const analysis = (typeof externalAnalyze === "function"
        ? tryExternalAnalyze(userText)
        : fallbackGenerateStructuredResponse(userText)) as StructuredResponse;
      const assistantText = (typeof externalGenerate === "function"
        ? tryExternalGenerate(analysis, userText)
        : structuredToPlainText(analysis));
      setStructuredLast(analysis);
      appendMessage({ role: "assistant", content: assistantText });
      recordSymptoms(userText);
      setLoadingHint(null);
      setIsLoading(false);
      return;
    }

    // Otherwise call AI (auto or forced-ai)
    setLoadingHint("Contacting AI engine...");
    setIsLoading(true);
    try {
      const history = pruneMessagesForAI(messages, 8).map((m) => ({ role: m.role, content: m.content }));
      const payloadMessages: { role: Role; content: string }[] = [
        { role: "system", content: SYSTEM_PROMPT.trim() },
        ...history,
        { role: "user", content: userText },
      ];

      // Add a short local analysis hint (non-critical)
      try {
        const localAnalysis = (typeof externalAnalyze === "function"
          ? tryExternalAnalyze(userText)
          : fallbackGenerateStructuredResponse(userText)) as StructuredResponse;
        const compactHint = [
          `## LOCAL_ANALYSIS_START`,
          localAnalysis.possibleCauses ? `Possible causes (local): ${localAnalysis.possibleCauses.join("; ")}` : "",
          `Severity (local): ${localAnalysis.severity ?? "unknown"}`,
          `## LOCAL_ANALYSIS_END`,
        ].join("\n");
        payloadMessages.unshift({ role: "system", content: compactHint });
      } catch (err) {
        // ignore
      }

      const hintTimer = setTimeout(() => setLoadingHint("Analyzing symptoms..."), 300);
      const aiRawReply = await callAI(payloadMessages);
      clearTimeout(hintTimer);

      // parse structured content if AI included it
      const parsed = parseStructuredFromText(aiRawReply);
      setStructuredLast(parsed);

      // append AI reply as assistant (no emergency re-eval on AI reply)
      appendMessage({ role: "assistant", content: aiRawReply });
      recordSymptoms(userText);

      setLoadingHint(null);
      setIsLoading(false);
      return;
    } catch (err: any) {
      console.error("AI call failed:", err);
      // fallback: local rule-based response
      try {
        const analysis = fallbackGenerateStructuredResponse(userText);
        const fallbackText = structuredToPlainText(analysis);
        setStructuredLast(analysis);
        appendMessage({ role: "assistant", content: fallbackText });
        recordSymptoms(userText);
      } catch (e) {
        appendMessage({
          role: "assistant",
          content:
            "⚠️ I'm having trouble connecting to the AI. Please try again or use the Emergency button if needed.",
        });
      } finally {
        setLoadingHint(null);
        setIsLoading(false);
      }
    }
  }

  /* -------------------------- helpers: try external ------------------ */
  function tryExternalIsEmergency(message: string) {
    try {
      return (externalIsEmergency as any).call(null, message);
    } catch (e) {
      console.warn("externalIsEmergency failed", e);
      return fallbackIsEmergency(message);
    }
  }
  function tryExternalAnalyze(message: string) {
    try {
      return (externalAnalyze as any).call(null, message);
    } catch (e) {
      console.warn("externalAnalyze failed", e);
      return fallbackGenerateStructuredResponse(message);
    }
  }
  function tryExternalGenerate(analysis: StructuredResponse, message: string) {
    try {
      return (externalGenerate as any).call(null, analysis, message);
    } catch (e) {
      console.warn("externalGenerate failed", e);
      return structuredToPlainText(analysis);
    }
  }

  /* ----------------------- helpers: structured -> text --------------- */
  function structuredToPlainText(s: StructuredResponse) {
    const lines: string[] = [];
    if (s.possibleCauses && s.possibleCauses.length) {
      lines.push("🩺 Possible Causes:");
      s.possibleCauses.forEach((c) => lines.push(`• ${c}`));
      lines.push("");
    }
    if (s.severity) {
      lines.push(`⚠️ Severity Level: ${s.severity.toUpperCase()}`);
      lines.push("");
    }
    if (s.immediateActions && s.immediateActions.length) {
      lines.push("✅ What You Can Do Now:");
      s.immediateActions.forEach((a) => lines.push(`• ${a}`));
      lines.push("");
    }
    if (s.whenToSeekHelp && s.whenToSeekHelp.length) {
      lines.push("🚨 When To Seek Immediate Help:");
      s.whenToSeekHelp.forEach((w) => lines.push(`• ${w}`));
      lines.push("");
    }
    if (s.raw) {
      lines.push(`\n${s.raw}`);
    }
    return lines.join("\n");
  }

  /* ----------------------- helpers: prune messages for AI ------------ */
  function pruneMessagesForAI(all: Message[], keep = 8) {
    const list = all.filter((m) => m.role !== "system");
    const start = Math.max(0, list.length - keep);
    return list.slice(start).map((m) => ({ ...m }));
  }

  /* ------------------------- handle send action --------------------- */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    appendMessage({ role: "user", content: trimmed });
    // small delay so UI can paint the user message before processing
    setTimeout(() => {
      processUserMessage(trimmed).catch((e) => console.error(e));
    }, 40);
  };

  /* ------------------------- quick UI helpers ----------------------- */
  const exportTranscript = () => {
    const payload = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    setTranscriptExport(payload);
    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeline-chat-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearConversation = () => {
    setMessages([]);
    setSymptomRecords([]);
    setStructuredLast(null);
    setUploads([]);
    setTranscriptExport(null);
    setTimeout(() => setIsOpen(true), 50);
  };

  /* ------------------------- voice control -------------------------- */
  const toggleVoice = () => {
    if (!speechSupported || !speechRef.current) return;
    const sr = speechRef.current;
    if (voiceActive) {
      try {
        sr.stop();
      } catch (e) {}
      setVoiceActive(false);
    } else {
      try {
        sr.start();
      } catch (e) {
        console.warn("Speech start failed", e);
      }
      setVoiceActive(true);
    }
  };

  /* ------------------------ small utilities ------------------------- */
  const lastUserText = messages.slice().reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistantText = messages.slice().reverse().find((m) => m.role === "assistant")?.content ?? "";

  /* --------------------------- RENDERERS ---------------------------- */

  function SeverityMeter({ level }: { level: SeverityLevel }) {
    const { pct, color, label } = severityToPercent(level);
    return (
      <div className="flex items-center gap-3">
        <div className="w-36 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={`${color} h-full transition-all duration-500`}
            aria-hidden
          />
        </div>
        <div className="text-xs font-medium uppercase">{label}</div>
      </div>
    );
  }

  function StructuredCard({ struct }: { struct: StructuredResponse | null }) {
    if (!struct) return null;
    const severity = struct.severity ?? "unknown";
    return (
      <div className="space-y-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Health Summary</div>
          <SeverityMeter level={severity as SeverityLevel} />
        </div>

        {struct.possibleCauses && (
          <div className="bg-white p-3 rounded shadow-sm text-sm">
            <div className="font-medium text-xs uppercase text-muted-foreground">Possible Causes</div>
            <ul className="mt-2 list-inside space-y-1">
              {struct.possibleCauses.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs">•</span>
                  <span className="text-sm">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {struct.immediateActions && (
          <div className="bg-white p-3 rounded shadow-sm text-sm">
            <div className="font-medium text-xs uppercase text-muted-foreground">Immediate Actions</div>
            <ul className="mt-2 list-inside space-y-1">
              {struct.immediateActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs">•</span>
                  <span className="text-sm">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {struct.whenToSeekHelp && (
          <div className="bg-white p-3 rounded shadow-sm text-sm">
            <div className="font-medium text-xs uppercase text-muted-foreground">When To Seek Help</div>
            <ul className="mt-2 list-inside space-y-1">
              {struct.whenToSeekHelp.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs">•</span>
                  <span className="text-sm">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {struct.raw && (
          <div className="bg-muted p-2 rounded text-xs text-muted-foreground">
            <strong>Raw AI output:</strong>
            <div className="mt-1 whitespace-pre-wrap">{struct.raw}</div>
          </div>
        )}
      </div>
    );
  }

  function SymptomTimeline({ items }: { items: SymptomRecord[] }) {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-3">
        <div className="text-xs font-medium text-muted-foreground">Symptoms mentioned</div>
        <div className="mt-2 flex flex-col gap-2">
          {items.map((s) => (
            <div key={s.text} className="flex items-center justify-between bg-white p-2 rounded">
              <div className="text-sm">{s.text}</div>
              <div className="text-xs text-muted-foreground">{new Date(s.firstMentionAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function UploadList({ items }: { items: UploadSummary[] }) {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-3">
        <div className="text-xs font-medium text-muted-foreground">Uploaded files</div>
        <div className="mt-2 space-y-2">
          {items.map((u, idx) => (
            <div key={`${u.name}_${idx}`} className="bg-white p-2 rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(u.size / 1024)} KB</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.preview ? (
                  <a href={u.preview} target="_blank" rel="noreferrer" className="text-xs">
                    Preview
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No preview</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function EmergencyBanner() {
    if (!isEmergencyMode) return null;
    return (
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full p-3 bg-red-600 text-white rounded-md flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <div className="font-semibold">EMERGENCY DETECTED</div>
            <div className="text-xs">If you or someone is in danger, contact emergency services immediately.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={() => window.open("tel:112")}>
            Call (demo) 112
          </Button>
          <Button size="sm" onClick={() => handleEmergency()}>
            Quick Emergency
          </Button>
        </div>
      </motion.div>
    );
  }

  function MessageBubble({ m }: { m: Message }) {
    const clsUser = "bg-primary text-white rounded-br-sm";
    const clsAssistant = "bg-muted text-black rounded-bl-sm";
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.12 }}
        className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
      >
        {m.role === "assistant" && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <div
          className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? clsUser : clsAssistant}`}
        >
          {m.content}
        </div>
        {m.role === "user" && (
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-secondary" />
          </div>
        )}
      </motion.div>
    );
  }

  /* --------------------------- JSX: main UI -------------------------- */

  return (
    <>
      {/* Launcher button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            title="Open Lifeline-X Chat"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window & overlay (single-root inside AnimatePresence to avoid fragment mistakes) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-stretch"
            aria-hidden={!isOpen}
          >
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* panel - right, responsive */}
            <motion.div
              initial={{ x: 180, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 180, opacity: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 22 }}
              className="ml-auto relative h-screen w-full lg:w-[85vw] bg-transparent"
            >
              <Card variant="elevated" className="h-full flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">LIFELINE-X Assistant</h3>
                      <p className="text-xs text-muted-foreground">Emergency Support • 24/7</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button title="Export Transcript" onClick={exportTranscript} className="p-2 rounded hover:bg-primary/10">
                      <Download className="w-4 h-4" />
                    </button>

                    <button title="Clear chat" onClick={clearConversation} className="p-2 rounded hover:bg-primary/10">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2">
                    <Button variant="emergency-outline" size="sm" className="w-full flex items-center justify-center gap-2" onClick={handleEmergency}>
                      <Heart className="w-4 h-4" />
                      Quick Emergency - Tap Here
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Button size="icon" variant={aiMode === "auto" ? "secondary" : "ghost"} onClick={() => setAiMode("auto")} title="Auto (rules + AI)">
                      <Zap className="w-4 h-4" />
                    </Button>

                    <Button size="icon" variant={aiMode === "forced-ai" ? "secondary" : "ghost"} onClick={() => setAiMode("forced-ai")} title="Forced AI">
                      <Bot className="w-4 h-4" />
                    </Button>

                    <Button size="icon" variant={aiMode === "rules-only" ? "secondary" : "ghost"} onClick={() => setAiMode("rules-only")} title="Rules Only">
                      <Info className="w-4 h-4" />
                    </Button>

                    <div className="ml-auto text-xs text-muted-foreground">Mode</div>
                  </div>
                </div>

                {/* Emergency banner */}
                <div className="p-2">
                  <EmergencyBanner />
                </div>

                {/* Content area */}
                <div className="flex-1 flex overflow-hidden">
                  {/* messages area - sole scrollable container */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" style={{ scrollBehavior: "smooth" }}>
                    {messages.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground mt-8">No conversation yet. Say hi or describe symptoms.</div>
                    ) : (
                      messages.map((m) => <MessageBubble key={m.id} m={m} />)
                    )}

                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                          <motion.div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-muted-foreground/50"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                              />
                            ))}
                          </motion.div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* right column: structured / uploads / symptoms (desktop only) */}
                  <div className="w-[320px] border-l p-3 bg-white hidden lg:block overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Assistant Panel</div>
                      <div className="text-xs text-muted-foreground">Live</div>
                    </div>

                    <StructuredCard struct={structuredLast} />

                    <SymptomTimeline items={symptomRecords} />

                    <UploadList items={uploads} />

                    <div className="mt-4 space-y-2">
                      <label className="block">
                        <div className="text-xs text-muted-foreground mb-1">Upload health report</div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(f);
                            }}
                            className="block w-full text-xs"
                          />
                          <Button size="icon" onClick={() => alert("Upload saved (demo)")}>
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </label>

                      <div className="flex justify-between">
                        <Button size="sm" onClick={exportTranscript}>
                          <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowDebug((s) => !s)}>
                          {showDebug ? "Hide" : "Debug"}
                        </Button>
                      </div>
                    </div>

                    {showDebug && (
                      <div className="mt-3 text-xs bg-muted p-2 rounded">
                        <div className="font-medium">Debug</div>
                        <div className="mt-2">Messages: {messages.length}</div>
                        <div>Symptoms: {symptomRecords.length}</div>
                        <div>Uploads: {uploads.length}</div>
                        <div className="mt-2 text-xs">Last user: {lastUserText.slice(0, 120)}</div>
                        <div className="text-xs mt-1">Last assistant: {lastAssistantText.slice(0, 120)}</div>
                        <div className="mt-2 text-xxs text-muted-foreground">Hint: {loadingHint ?? "idle"}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input area */}
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const samples = [
                            "I have a fever of 102°F and headache for 2 days.",
                            "I feel chest pain and shortness of breath.",
                            "My child has a rash and high fever.",
                          ];
                          setInput(samples[Math.floor(Math.random() * samples.length)]);
                        }}
                        title="Sample"
                        className="px-2 py-1 rounded border hover:bg-primary/5 text-xs"
                      >
                        Samples
                      </button>
                    </div>

                    <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your symptoms..." className="flex-1" disabled={isLoading} />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (speechSupported) toggleVoice();
                          else alert("Speech not supported in this browser (demo)");
                        }}
                        className={`p-2 rounded ${voiceActive ? "bg-primary/10" : ""}`}
                        title="Voice input"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </form>

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">Telugu • Hindi • English supported</div>
                    <div className="text-xs text-muted-foreground">Mode: {aiMode}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Chatbot;
