// Server-only helper for calling the Lovable AI Gateway.
// Never import this from client code paths.

export type ToolResult = {
  title: string;
  summary: string;
  riskLevel: "low" | "moderate" | "high" | "urgent" | "info";
  sections: { heading: string; items: string[] }[];
  warnings: string[];
  recommendations: string[];
  specialist?: string;
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
  "sections": [{ "heading": string, "items": string[] }],
  "warnings": string[],
  "recommendations": string[],
  "specialist": string (which doctor/specialist to consult, or ""),
  "nutrition": { "dish_name": string, "calories": number, "protein_g": number, "sugar_g": number, "sodium_mg": number, "saturated_fat_g": number, "fibre_g": number } (ONLY for meal analysis, otherwise omit)
}`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function callHealthAI(opts: {
  system: string;
  userText: string;
  imageDataUrl?: string | null;
}): Promise<ToolResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const userContent: ContentPart[] = [{ type: "text", text: opts.userText }];
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
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    specialist: parsed.specialist || undefined,
    nutrition: parsed.nutrition,
  };
}

export function buildToolPrompt(tool: string): string {
  switch (tool) {
    case "medguard":
      return "You are MedGuard, a clinical pharmacology assistant. Given a medicine, dosage and duration, produce a careful side-effect analysis. Use sections for 'Short-term side effects', 'Medium-term effects', 'Long-term risks', and 'Dangerous combinations'. Put safer alternatives in recommendations. Flag interactions with the user's current medicines. Be honest about uncertainty.";
    case "cancersense":
      return "You are CancerSense, a preventive-oncology risk educator. From lifestyle answers and profile, estimate relative cancer risk. Use sections like 'Risk factors identified', 'Most relevant cancer types', and 'Recommended screening tests'. Set riskLevel by overall concern. Never state a diagnosis.";
    case "sensecheck":
      return "You are SenseCheck, a vision and hearing screening assistant. Interpret described symptoms. Use sections 'Vision assessment' and 'Hearing assessment'. Recommend specific home checks and when to see an optometrist or audiologist. Flag emergencies as urgent.";
    case "calorieeye":
      return "You are CalorieEye, a nutrition vision assistant. Identify the meal in the photo and estimate nutrition. ALWAYS fill the nutrition object with numeric estimates. Use sections 'What I see' and 'Nutrition vs daily limits'. Note concerns for the user's health conditions in warnings.";
    case "skinscan":
      return "You are SkinScan, a dermatology visual screening assistant. From the photo and notes, assess the most likely condition and severity. Use sections 'Likely condition', 'Severity', and 'Care guidance'. If ANY sign suggests possible skin cancer (asymmetry, irregular border, multiple colours, large diameter, evolving), set riskLevel to 'urgent' and say so clearly in warnings. Never give a definitive diagnosis.";
    case "medverify":
      return "You are MedVerify, a medicine authenticity reviewer doing a CDSCO-style simulated check. From the batch number and details, reason about plausibility of authenticity, expiry validity and recall likelihood. Use sections 'Authenticity review', 'Expiry check', and 'Recall check'. ALWAYS include a warning to confirm with a licensed pharmacist since this is not a live regulator lookup.";
    default:
      return "You are a careful, honest medical information assistant. Provide educational guidance only.";
  }
}
