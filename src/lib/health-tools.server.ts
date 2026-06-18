// Server-only helper for calling the Lovable AI Gateway.
// Never import this from client code paths.

export type ToolResult = {
  title: string;
  summary: string;
  riskLevel: "low" | "moderate" | "high" | "urgent" | "info";
  /** Optional 5-level urgency for scan/heart tools. */
  urgency?: "normal" | "watch" | "attention" | "urgent" | "emergency";
  sections: { heading: string; items: string[] }[];
  warnings: string[];
  recommendations: string[];
  specialist?: string;
  /** 0-100 preventive score (CancerSense). */
  preventionScore?: number;
  /** Sugar / glycemic intelligence (SugarSense, CalorieEye). */
  sugarImpact?: {
    score?: number; // 0-100 Sugar Impact Index
    level?: string; // Safe / Low / Moderate / High / Critical
    glycemicIndex?: number;
    glycemicLoad?: number;
    verdict?: string; // Safe / Caution / Avoid
  };
  nutrition?: {
    calories?: number;
    protein_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    saturated_fat_g?: number;
    fibre_g?: number;
    dish_name?: string;
  };
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const RESULT_SHAPE = `Return ONLY valid JSON (no markdown, no code fences) with exactly this shape:
{
  "title": string,
  "summary": string (2-3 sentences, plain language),
  "riskLevel": "low" | "moderate" | "high" | "urgent" | "info",
  "urgency": "normal" | "watch" | "attention" | "urgent" | "emergency" (ONLY for scan or heart tools, otherwise omit),
  "sections": [{ "heading": string, "items": string[] }],
  "warnings": string[],
  "recommendations": string[],
  "specialist": string (which doctor/specialist to consult, or ""),
  "preventionScore": number (0-100, ONLY for CancerSense, otherwise omit),
  "sugarImpact": { "score": number, "level": string, "glycemicIndex": number, "glycemicLoad": number, "verdict": "Safe"|"Caution"|"Avoid" } (ONLY for SugarSense and CalorieEye, otherwise omit),
  "nutrition": { "dish_name": string, "calories": number, "protein_g": number, "sugar_g": number, "sodium_mg": number, "saturated_fat_g": number, "fibre_g": number } (ONLY for meal analysis, otherwise omit)
}`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function callHealthAI(opts: {
  system: string;
  userText: string;
  imageDataUrl?: string | null;
  fileDataUrl?: string | null;
  fileName?: string | null;
  lang?: "en" | "hi";
}): Promise<ToolResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const langInstruction =
    opts.lang === "hi"
      ? "\n\nIMPORTANT: Write every string value in the JSON (title, summary, all section headings and items, warnings, recommendations, specialist, verdicts) in simple, everyday Hindi (Devanagari script). Keep the JSON keys and the enum values for riskLevel and urgency in English exactly as specified. Keep medicine and test names recognisable."
      : "";

  const userContent: ContentPart[] = [{ type: "text", text: opts.userText }];

  // A PDF/document is sent as a file part; everything else (image data URL)
  // goes through image_url.
  if (opts.fileDataUrl && opts.fileDataUrl.startsWith("data:application/pdf")) {
    userContent.push({
      type: "file",
      file: { filename: opts.fileName || "report.pdf", file_data: opts.fileDataUrl },
    });
  } else if (opts.fileDataUrl) {
    userContent.push({ type: "image_url", image_url: { url: opts.fileDataUrl } });
  }
  if (opts.imageDataUrl) {
    userContent.push({ type: "image_url", image_url: { url: opts.imageDataUrl } });
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `${opts.system}\n\n${RESULT_SHAPE}` },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (res.status === 402) {
    throw new Error("CREDITS_EXHAUSTED");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, text);
    throw new Error("AI_ERROR");
  }

  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed: ToolResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI_PARSE_ERROR");
    parsed = JSON.parse(match[0]);
  }

  return {
    title: parsed.title ?? "Result",
    summary: parsed.summary ?? "",
    riskLevel: parsed.riskLevel ?? "info",
    urgency: parsed.urgency,
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    specialist: parsed.specialist || undefined,
    preventionScore: typeof parsed.preventionScore === "number" ? parsed.preventionScore : undefined,
    sugarImpact: parsed.sugarImpact,
    nutrition: parsed.nutrition,
  };
}

export function buildToolPrompt(tool: string): string {
  switch (tool) {
    case "medguard":
      return "You are MedGuard, a clinical pharmacology assistant. Given a medicine, dosage and duration, produce a careful side-effect analysis. Use sections for 'Short-term side effects', 'Medium-term effects', 'Long-term risks', and 'Dangerous combinations'. Put safer alternatives in recommendations. Flag interactions with the user's current medicines. Be honest about uncertainty.";
    case "cancersense":
      return "You are CancerSense, a preventive-oncology risk educator. From the in-depth lifestyle answers and profile, estimate relative cancer risk across a clear meter (Low / Moderate / High / Critical) mapped to riskLevel. Use sections: 'Risk meter & overall picture', 'Top 3 contributing lifestyle factors', 'Most relevant cancer types & organ impact', 'Lifestyle changes that reduce risk (with rough % reduction)', and 'Step-by-step diagnostic roadmap' (each step: action, tests, estimated cost in INR). ALWAYS set preventionScore (0-100) and put 3 actionable weekly steps to improve it in recommendations. Never state a diagnosis.";
    case "sensecheck":
      return "You are SenseCheck, a vision and hearing screening assistant. Interpret described symptoms. Use sections 'Vision assessment' and 'Hearing assessment'. Recommend specific home checks and when to see an optometrist or audiologist. Flag emergencies as urgent.";
    case "calorieeye":
      return "You are CalorieEye, a nutrition vision assistant with diabetes intelligence. Identify the meal in the photo and estimate nutrition. ALWAYS fill the nutrition object with numeric estimates AND the sugarImpact object: score (0-100 Sugar Impact Index), level (Safe/Low/Moderate/High/Critical), glycemicIndex, glycemicLoad and verdict (Safe/Caution/Avoid for diabetics). Use sections 'What I see', 'Nutrition vs daily limits', and 'Sugar & glycemic impact'. If the user's profile mentions diabetes or pre-diabetes, add a clear diabetes-specific warning for any high-risk item in warnings.";
    case "skinscan":
      return "You are SkinScan, a dermatology visual screening assistant. From the photo and notes, assess the most likely condition and severity. Use sections 'Likely condition', 'Severity', and 'Care guidance'. If ANY sign suggests possible skin cancer (asymmetry, irregular border, multiple colours, large diameter, evolving), set riskLevel to 'urgent' and say so clearly in warnings. Never give a definitive diagnosis.";
    case "medverify":
      return "You are MedVerify, a medicine authenticity reviewer doing a CDSCO-style simulated check. From the batch number and details, reason about plausibility of authenticity, expiry validity and recall likelihood. Use sections 'Authenticity review', 'Expiry check', and 'Recall check'. ALWAYS include a warning to confirm with a licensed pharmacist since this is not a live regulator lookup.";
    case "sugarsense":
      return "You are SugarSense, a diabetes and sugar-impact educator for an Indian audience. From the symptom questionnaire and profile, classify diabetes risk into one of: 'No significant risk', 'Pre-diabetic risk', 'Likely diabetic — get an HbA1c test', or 'High risk — see an endocrinologist this week', and map it to riskLevel. Use sections: 'Your diabetes risk', 'Organ-level impact of high sugar', 'Your daily sugar budget', and (if foods were listed) 'Sugar Impact Index of your foods' with a 0-100 score and organ effect per item. Put safer Indian food swaps in recommendations. If foods were listed, also fill the sugarImpact object for the worst item. Never diagnose — always advise an HbA1c or fasting glucose blood test to confirm.";
    case "heartsense":
      return "You are HeartSense, a screening educator for silent heart conditions. From the questionnaire and family history, assess risk and map to riskLevel; also set urgency (normal/watch/attention/urgent/emergency). Use sections: 'Risk level & what it means', 'Conditions worth screening for' (e.g. ASD, VSD, valve prolapse, arrhythmia, cardiomyopathy — what each is and how it hides), and 'Diagnostic roadmap' (ECG, Echocardiogram, Holter, Chest X-Ray — what each checks and estimated INR cost). Recommend a cardiologist when appropriate. Never diagnose.";
    case "scaniq":
      return "You are ScanIQ, a medical scan and report analyser. Read the uploaded scan image or PDF report and explain it for a layperson. Set urgency to one of normal/watch/attention/urgent/emergency and map riskLevel accordingly. Use exactly these sections: 'What was found' (translate every medical term into plain language), 'Urgency level' (state the colour-coded level and what it means), 'Possible conditions' (ranked most to least likely with a one-line explanation), 'What to do next' (which specialist, what extra tests, questions to ask, estimated INR cost), and 'Comparison with previous reports' (note this needs prior reports to compare). Be explicit about uncertainty and that a doctor must confirm. If the file is unreadable, say so clearly in summary and warnings.";
    default:
      return "You are a careful, honest medical information assistant. Provide educational guidance only.";
  }
}
