/**
 * Health Chatbot Service
 * Integrates AI Health Chatbot logic for medical symptom detection and health advice
 */

// Symptom severity data
const symptomSeverity: Record<string, number> = {
  "itching": 3,
  "skin_rash": 4,
  "nodal_skin_eruptions": 5,
  "continuous_sneezing": 3,
  "shivering": 4,
  "chills": 4,
  "stomach_pain": 5,
  "acidity": 3,
  "vomiting": 5,
  "cough": 3,
  "chest_pain": 8,
  "weakness_of_one_body_side": 8,
  "high_fever": 6,
  "muscle_pain": 4,
  "joint_pain": 3,
  "fatigue": 3,
  "nausea": 4,
  "dizziness": 4,
  "headache": 3,
  "back_pain": 3,
};

// Symptom-to-disease mappings
const symptomToDiseases: Record<string, string[]> = {
  "itching": ["Allergy", "Psoriasis"],
  "skin_rash": ["Allergy", "Chickenpox", "Psoriasis"],
  "continuous_sneezing": ["Allergy", "Measles"],
  "chills": ["Dengue", "Malaria", "Typhoid"],
  "stomach_pain": ["Peptic Ulcer", "Gastritis", "GERD"],
  "vomiting": ["Cholera", "Gastritis", "Food Poisoning"],
  "cough": ["Common Cold", "Pneumonia", "Tuberculosis"],
  "chest_pain": ["Heart Attack", "Asthma", "Pneumonia"],
  "high_fever": ["Dengue", "Malaria", "Typhoid", "COVID-19"],
  "headache": ["Migraine", "Fever", "Stress"],
  "muscle_pain": ["Dengue", "Influenza", "COVID-19"],
  "dizziness": ["Anemia", "Blood Pressure", "Dehydration"],
  "fatigue": ["Anemia", "Depression", "Hypothyroidism"],
  "nausea": ["Gastritis", "Food Poisoning", "Pregnancy"],
};

// Disease precautions
const diseasePrecautions: Record<string, string[]> = {
  "Allergy": [
    "Avoid triggering agents",
    "Use air purifiers",
    "Take prescribed antihistamines",
    "Maintain hygiene",
  ],
  "Chickenpox": [
    "Stay isolated",
    "Use calamine lotion",
    "Take antiviral medication",
    "Avoid scratching",
  ],
  "Dengue": [
    "Get dengue test immediately",
    "Get adequate rest",
    "Drink plenty of fluids",
    "Seek medical attention",
    "Use mosquito repellent",
  ],
  "Malaria": [
    "Get blood test done",
    "Take antimalarial drugs",
    "Rest and hydration",
    "Use mosquito nets",
  ],
  "COVID-19": [
    "Get tested immediately",
    "Self-isolate for 10-14 days",
    "Wear masks",
    "Maintain social distance",
    "Consult doctor for vaccination",
  ],
  "Common Cold": [
    "Take rest",
    "Drink warm fluids",
    "Use saline nasal drops",
    "Eat vitamin C rich foods",
  ],
  "Pneumonia": [
    "Seek immediate medical attention",
    "Take antibiotics as prescribed",
    "Rest adequately",
    "Stay hydrated",
  ],
};

export interface HealthAnalysis {
  symptoms: string[];
  possibleDiseases: string[];
  severity: "low" | "medium" | "high" | "critical";
  precautions: string[];
  recommendation: string;
  shouldSeekMedical: boolean;
}

export function analyzeHealthSymptoms(userMessage: string): HealthAnalysis {
  const messageLower = userMessage.toLowerCase();
  
  // Detect symptoms from message
  const detectedSymptoms = Object.keys(symptomToDiseases).filter(symptom => 
    messageLower.includes(symptom.replace(/_/g, " "))
  );

  // Get possible diseases from symptoms
  const diseasesSet = new Set<string>();
  detectedSymptoms.forEach(symptom => {
    (symptomToDiseases[symptom] || []).forEach(disease => {
      diseasesSet.add(disease);
    });
  });

  const possibleDiseases = Array.from(diseasesSet);
  
  // Calculate severity
  let totalSeverity = 0;
  detectedSymptoms.forEach(symptom => {
    totalSeverity += symptomSeverity[symptom] || 1;
  });
  const avgSeverity = detectedSymptoms.length > 0 ? totalSeverity / detectedSymptoms.length : 0;
  
  let severity: "low" | "medium" | "high" | "critical" = "low";
  if (avgSeverity > 6.5) severity = "critical";
  else if (avgSeverity > 5) severity = "high";
  else if (avgSeverity > 3.5) severity = "medium";

  // Collect precautions
  const precautionsSet = new Set<string>();
  possibleDiseases.forEach(disease => {
    (diseasePrecautions[disease] || []).forEach(precaution => {
      precautionsSet.add(precaution);
    });
  });

  const shouldSeekMedical = severity === "critical" || severity === "high" || 
    messageLower.includes("emergency") || messageLower.includes("urgent");

  let recommendation = "";
  if (shouldSeekMedical) {
    recommendation = `🚨 **URGENT: Please seek medical attention immediately!** Based on your symptoms, this requires professional evaluation. If experiencing chest pain, difficulty breathing, or severe symptoms, call emergency services NOW.`;
  } else if (severity === "medium") {
    recommendation = `⚠️ Your symptoms suggest you should consult a healthcare provider. Please schedule an appointment with a doctor for proper diagnosis and treatment.`;
  } else {
    recommendation = `✅ Your symptoms appear mild. However, if they persist or worsen, please consult a healthcare provider.`;
  }

  return {
    symptoms: detectedSymptoms,
    possibleDiseases,
    severity,
    precautions: Array.from(precautionsSet),
    recommendation,
    shouldSeekMedical,
  };
}

export function generateHealthResponse(analysis: HealthAnalysis, userMessage: string): string {
  let response = "";

  if (analysis.symptoms.length === 0) {
    response = `I understand you mentioned: "${userMessage}"\n\nTo help you better, please describe your symptoms clearly. For example: "I have a headache and high fever" or "I have chest pain and difficulty breathing".\n\nTell me about your symptoms and I'll help analyze them.`;
  } else {
    response = `📋 **Health Analysis**\n\n`;
    
    response += `**Symptoms Detected:** ${analysis.symptoms.map(s => s.replace(/_/g, " ")).join(", ")}\n\n`;
    
    if (analysis.possibleDiseases.length > 0) {
      response += `**Possible Conditions:** ${analysis.possibleDiseases.join(", ")}\n\n`;
    }

    response += `**Severity Level:** ${analysis.severity.toUpperCase()} `;
    if (analysis.severity === "critical") response += "🔴";
    else if (analysis.severity === "high") response += "🟠";
    else if (analysis.severity === "medium") response += "🟡";
    else response += "🟢";
    response += "\n\n";

    if (analysis.precautions.length > 0) {
      response += `**Recommended Precautions:**\n`;
      analysis.precautions.forEach(precaution => {
        response += `• ${precaution}\n`;
      });
      response += "\n";
    }

    response += analysis.recommendation;

    if (analysis.shouldSeekMedical && !analysis.recommendation.includes("URGENT")) {
      response += `\n\n💡 **Next Steps:**\n• Contact a healthcare provider\n• Have your medical history ready\n• Note when symptoms started\n• Monitor symptom progression`;
    }
  }

  return response;
}

export function isEmergencySituation(message: string): boolean {
  const emergencyKeywords = [
    "chest pain", "difficulty breathing", "emergency", "urgent",
    "unconscious", "severe bleeding", "poisoning", "overdose",
    "heart attack", "stroke", "choking", "anaphylaxis"
  ];
  
  const messageLower = message.toLowerCase();
  return emergencyKeywords.some(keyword => messageLower.includes(keyword));
}

// --- External data loader ---
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const rows: string[][] = [];
  if (lines.length === 0) return rows;
  // Try to detect header and parse naively (handles simple quoted CSV)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { parts.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.length) parts.push(cur.trim());
    // If this looks like a header (contains non-numeric text), keep it as data as well — callers will ignore header if needed
    rows.push(parts);
  }
  // Remove header if it contains non-data keywords
  if (rows.length > 0) {
    const header = rows[0].map(h => h.toLowerCase());
    if (header.includes('symptom') || header.includes('disease') || header.includes('severity')) {
      rows.shift();
    }
  }
  return rows;
}

export async function loadExternalHealthData(): Promise<void> {
  const base = '/health_chatbot';
  async function fetchText(path: string) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  }

  try {
    // dataset.csv -> supports either (symptom,disease) rows OR (disease, symptom1, symptom2, ...)
    const datasetText = await fetchText(`${base}/Data/dataset.csv`);
    if (datasetText) {
      const rows = parseCSV(datasetText);
      rows.forEach(cols => {
        // normalize columns
        const clean = cols.map(c => (c || '').toString().trim()).filter(c => c.length > 0);
        if (clean.length < 2) return;

        // Heuristic: if first column contains spaces and there are multiple following columns, treat as (disease, symptom...)
        const first = clean[0];
        const second = clean[1] || '';
        const isDiseaseFirst = clean.length > 2 || /\s/.test(first) && second && !/\d/.test(second);

        if (isDiseaseFirst) {
          const disease = first.trim();
          const symptoms = clean.slice(1);
          symptoms.forEach(s => {
            const key = s.toLowerCase().replace(/\s+/g, '_');
            if (!symptomToDiseases[key]) symptomToDiseases[key] = [];
            if (!symptomToDiseases[key].includes(disease)) symptomToDiseases[key].push(disease);
          });
        } else {
          // fallback: (symptom,disease) pair
          const symptom = first;
          const disease = second;
          const key = symptom.toLowerCase().replace(/\s+/g, '_');
          if (!symptomToDiseases[key]) symptomToDiseases[key] = [];
          if (!symptomToDiseases[key].includes(disease)) symptomToDiseases[key].push(disease);
        }
      });
    }

    // Symptom severity
    const sevText = await fetchText(`${base}/MasterData/Symptom_severity.csv`);
    if (sevText) {
      const rows = parseCSV(sevText);
      rows.forEach(cols => {
        const symptom = cols[0];
        const score = cols[1];
        if (!symptom) return;
        const key = symptom.toLowerCase().replace(/\s+/g, '_');
        const v = Number(score);
        if (!Number.isNaN(v)) symptomSeverity[key] = v;
      });
    }

    // symptom_precaution.csv -> symptom,precaution
    const precText = await fetchText(`${base}/MasterData/symptom_precaution.csv`);
    if (precText) {
      const rows = parseCSV(precText);
      rows.forEach(cols => {
        const symptom = cols[0];
        const precaution = cols[1];
        if (!symptom || !precaution) return;
        const key = symptom.toLowerCase().replace(/\s+/g, '_');
        const diseases = symptomToDiseases[key] || [];
        if (diseases.length === 0) {
          // If no disease mapping exists yet, store under a synthetic key
          const metaName = `symptom:${key}`;
          if (!diseasePrecautions[metaName]) diseasePrecautions[metaName] = [];
          if (!diseasePrecautions[metaName].includes(precaution.trim())) diseasePrecautions[metaName].push(precaution.trim());
        } else {
          diseases.forEach(d => {
            if (!diseasePrecautions[d]) diseasePrecautions[d] = [];
            if (!diseasePrecautions[d].includes(precaution.trim())) diseasePrecautions[d].push(precaution.trim());
          });
        }
      });
    }

    console.log('Health chatbot: external data loaded (if present).');
  } catch (e) {
    console.warn('Health chatbot: failed to load external data', e);
  }
}
