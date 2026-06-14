import {
  Pill,
  ShieldAlert,
  Ear,
  Camera,
  ScanFace,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export type ToolField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "image";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  voice?: boolean;
};

export type ToolDef = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: "primary" | "pulse" | "success" | "warning";
  howItWorks: string[];
  disclaimer: string;
  fields: ToolField[];
  cta: string;
};

export const TOOLS: ToolDef[] = [
  {
    slug: "medguard",
    name: "MedGuard",
    tagline: "Know your medicine before you take it",
    description:
      "Enter any medicine with its dosage and duration to get a clear short, medium and long-term side-effect report, dangerous-combination flags and safer alternatives.",
    icon: Pill,
    accent: "primary",
    howItWorks: [
      "Enter the medicine name, dosage and how long you'll take it",
      "AI cross-checks it against your health profile and current medicines",
      "Get a 3-level side-effect report with warnings and safer alternatives",
    ],
    disclaimer:
      "MedGuard provides educational information only and is not a substitute for advice from a qualified doctor or pharmacist. Never start, stop or change a medicine based solely on this report. In an emergency, contact a medical professional immediately.",
    cta: "Analyze medicine",
    fields: [
      { name: "medicine", label: "Medicine name", type: "text", placeholder: "e.g. Paracetamol 500mg", required: true },
      { name: "dosage", label: "Dosage", type: "text", placeholder: "e.g. 1 tablet twice a day" },
      { name: "duration", label: "Duration", type: "text", placeholder: "e.g. 5 days" },
      { name: "reason", label: "Reason for taking (optional)", type: "textarea", placeholder: "What are you taking this for?" },
    ],
  },
  {
    slug: "cancersense",
    name: "CancerSense",
    tagline: "Catch risk early, live longer",
    description:
      "Answer a short lifestyle questionnaire and receive a personalized cancer-risk assessment with likely types, reasoning, recommended screening tests and the right specialist to see.",
    icon: ShieldAlert,
    accent: "pulse",
    howItWorks: [
      "Answer simple questions about lifestyle and family history",
      "AI weighs your answers against your health profile",
      "Receive a personalized risk report with recommended tests",
    ],
    disclaimer:
      "CancerSense gives a statistical, educational estimate only — it cannot diagnose cancer. A low result is not a guarantee of health and a high result is not a diagnosis. Only clinical screening and a qualified oncologist can confirm any condition.",
    cta: "Assess my risk",
    fields: [
      { name: "smoking", label: "Tobacco / smoking", type: "select", options: ["Never", "Former", "Occasional", "Daily"] },
      { name: "alcohol", label: "Alcohol", type: "select", options: ["None", "Occasional", "Weekly", "Daily"] },
      { name: "diet", label: "Diet quality", type: "select", options: ["Mostly fresh & balanced", "Mixed", "Mostly processed / fried"] },
      { name: "activity", label: "Physical activity", type: "select", options: ["Active most days", "Sometimes", "Rarely"] },
      { name: "family_cancer", label: "Family history of cancer", type: "text", placeholder: "e.g. mother — breast cancer" },
      { name: "symptoms", label: "Any persistent symptoms?", type: "textarea", placeholder: "Unexplained weight loss, lumps, persistent cough…" },
    ],
  },
  {
    slug: "sensecheck",
    name: "SenseCheck",
    tagline: "Your voice-guided vision & hearing check",
    description:
      "A voice-friendly diagnostic for vision and hearing. Describe what you notice — speak or type — and get a clear assessment with next steps you can download.",
    icon: Ear,
    accent: "success",
    howItWorks: [
      "Describe your vision and hearing experience (speak or type)",
      "AI interprets the symptoms with your profile in mind",
      "Get an assessment and clear next steps to act on",
    ],
    disclaimer:
      "SenseCheck is a preliminary screening aid only and cannot replace an eye test by an optometrist or a hearing test by an audiologist. Sudden vision or hearing loss is a medical emergency — seek care immediately.",
    cta: "Run SenseCheck",
    fields: [
      { name: "vision_symptoms", label: "Vision — what do you notice?", type: "textarea", placeholder: "Blurry far away, strain, floaters, difficulty at night…", voice: true },
      { name: "hearing_symptoms", label: "Hearing — what do you notice?", type: "textarea", placeholder: "Ringing, muffled sounds, trouble in noisy rooms…", voice: true },
    ],
  },
  {
    slug: "calorieeye",
    name: "CalorieEye",
    tagline: "Snap your meal, see the truth",
    description:
      "Take a photo of any meal and get an instant nutrient breakdown against your daily limits, saved to your food diary with a weekly disease-risk view.",
    icon: Camera,
    accent: "warning",
    howItWorks: [
      "Upload or snap a photo of your meal",
      "AI estimates calories, protein, sugar, sodium and more",
      "It's saved to your diary to track weekly health risk",
    ],
    disclaimer:
      "CalorieEye gives approximate nutritional estimates from a photo and may be inaccurate for hidden ingredients, oils and portion sizes. Do not rely on it for medical diets — consult a registered dietitian for clinical nutrition needs.",
    cta: "Analyze meal",
    fields: [
      { name: "image", label: "Meal photo", type: "image", required: true },
      { name: "meal_note", label: "Note (optional)", type: "text", placeholder: "e.g. lunch, home-cooked" },
    ],
  },
  {
    slug: "skinscan",
    name: "SkinScan",
    tagline: "Read your skin before it's serious",
    description:
      "Upload a photo of a skin concern to get a likely condition, severity rating, an URGENT flag for possible skin-cancer signs, and home-care vs specialist guidance.",
    icon: ScanFace,
    accent: "pulse",
    howItWorks: [
      "Upload a clear, well-lit photo of the skin area",
      "AI assesses likely condition and severity",
      "Get home-care guidance or an urgent specialist referral",
    ],
    disclaimer:
      "SkinScan is an educational visual aid and cannot diagnose skin cancer or any disease. An URGENT flag means 'see a dermatologist quickly', not a diagnosis. Any changing, bleeding or growing mole must be examined by a doctor.",
    cta: "Scan my skin",
    fields: [
      { name: "image", label: "Skin photo", type: "image", required: true },
      { name: "area", label: "Body area", type: "text", placeholder: "e.g. left forearm" },
      { name: "duration", label: "How long present?", type: "text", placeholder: "e.g. 3 weeks" },
      { name: "symptoms", label: "Symptoms", type: "textarea", placeholder: "Itchy, painful, changing colour…" },
    ],
  },
  {
    slug: "medverify",
    name: "MedVerify",
    tagline: "Make sure your medicine is real",
    description:
      "Enter a medicine's batch number to run an authenticity, expiry and recall check in a CDSCO-style review — with a clear reminder to confirm with your pharmacist.",
    icon: BadgeCheck,
    accent: "primary",
    howItWorks: [
      "Enter the batch number and medicine details from the pack",
      "AI runs a CDSCO-style authenticity and recall review",
      "Get a verdict with clear next steps",
    ],
    disclaimer:
      "MedVerify performs an AI-simulated, CDSCO-style review and does NOT connect to an official live regulator database. Always confirm authenticity, expiry and recalls with a licensed pharmacist or the official manufacturer before use.",
    cta: "Verify medicine",
    fields: [
      { name: "batch_number", label: "Batch number", type: "text", placeholder: "As printed on the pack", required: true },
      { name: "medicine_name", label: "Medicine name", type: "text", placeholder: "e.g. Azithromycin 500" },
      { name: "expiry", label: "Printed expiry", type: "text", placeholder: "e.g. 08/2026" },
      { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "e.g. Cipla" },
    ],
  },
];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
