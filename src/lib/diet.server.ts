// Server-only helpers for AI diet-plan generation and parsing.
// Never import from client code paths.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type DietMeal = { breakfast: string; lunch: string; dinner: string; snack: string; calories: number; sugar_load: string };
export type DietPlan = {
  title: string;
  summary: string;
  days: { day: string; breakfast: string; lunch: string; dinner: string; snack: string; calories: number; sugar_load: string }[];
  tips: string[];
  warnings: string[];
};

const PLAN_SHAPE = `Return ONLY valid JSON (no markdown, no code fences) with exactly this shape:
{
  "title": string,
  "summary": string (2 sentences),
  "days": [ { "day": string (e.g. "Monday"), "breakfast": string, "lunch": string, "dinner": string, "snack": string, "calories": number, "sugar_load": "Low"|"Medium"|"High" } ] (exactly 7 items, Monday..Sunday),
  "tips": string[] (3-4 practical cooking / adherence tips),
  "warnings": string[] (any items to watch for given the health conditions; empty if none)
}`;

async function callPlanAI(system: string, userText: string, lang: "en" | "hi", fileDataUrl?: string | null, fileName?: string | null): Promise<DietPlan> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const langInstruction =
    lang === "hi"
      ? "\n\nWrite all meal names, summary, tips and warnings in simple everyday Hindi (Devanagari). Keep JSON keys and sugar_load values (Low/Medium/High) in English."
      : "";

  const content: any[] = [{ type: "text", text: userText }];
  if (fileDataUrl && fileDataUrl.startsWith("data:application/pdf")) {
    content.push({ type: "file", file: { filename: fileName || "diet.pdf", file_data: fileDataUrl } });
  } else if (fileDataUrl) {
    content.push({ type: "image_url", image_url: { url: fileDataUrl } });
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `${system}\n\n${PLAN_SHAPE}${langInstruction}` },
        { role: "user", content },
      ],
    }),
  });

  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
  if (!res.ok) {
    console.error("Diet AI error", res.status, await res.text().catch(() => ""));
    throw new Error("AI_ERROR");
  }

  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed: DietPlan;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI_PARSE_ERROR");
    parsed = JSON.parse(m[0]);
  }
  return {
    title: parsed.title ?? "Your diet plan",
    summary: parsed.summary ?? "",
    days: Array.isArray(parsed.days) ? parsed.days.slice(0, 7) : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  };
}

export async function generateDietAI(opts: {
  profileText: string;
  prefsText: string;
  lang: "en" | "hi";
}): Promise<DietPlan> {
  const system =
    "You are Nirogi's diet-plan generator for an Indian audience. Create a realistic, affordable, regionally appropriate 7-day meal plan tailored to the person's health conditions, goal, cuisine, budget, allergies and cooking time. Prefer whole foods, high fibre and controlled sugar. Give exact-ish portions in the meal text. Keep calories aligned to the stated daily target.";
  return callPlanAI(system, `${opts.profileText}\n\nPreferences:\n${opts.prefsText}`, opts.lang);
}

export async function parseDietAI(opts: {
  profileText: string;
  text?: string | null;
  fileDataUrl?: string | null;
  fileName?: string | null;
  lang: "en" | "hi";
}): Promise<DietPlan> {
  const system =
    "You are Nirogi's diet-plan reader. The user already has a diet plan from a doctor, dietitian or trainer. Read it (from the text and/or attached image/PDF) and restructure it into a clean 7-day plan. If the source only covers a single day or generic guidance, sensibly repeat/vary it across 7 days while staying faithful to it. Flag anything in the plan that could be harmful for the person's stated health conditions in warnings.";
  const userText = `${opts.profileText}\n\nExisting plan (typed text, may be empty if a file is attached):\n${opts.text || "(see attached file)"}`;
  return callPlanAI(system, userText, opts.lang, opts.fileDataUrl, opts.fileName);
}
