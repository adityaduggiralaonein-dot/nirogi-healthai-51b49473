import {
  Pill,
  ShieldAlert,
  Ear,
  Camera,
  ScanFace,
  BadgeCheck,
  Droplets,
  HeartPulse,
  ScanLine,
  Brain,
  Droplet,
  Thermometer,
  Bone,
  Hourglass,
  type LucideIcon,
} from "lucide-react";

export type ToolField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "image" | "file";
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
  /** Symptoms that mean "stop and seek urgent care now". */
  redFlags: string[];
  /** Short tool-specific emergency instruction. */
  emergency: string;
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
      "MedGuard provides educational information only and is not a substitute for advice from a qualified doctor or pharmacist. Never start, stop or change a medicine based solely on this report.",
    redFlags: [
      "Difficulty breathing, swelling of the face, lips or throat, or a spreading rash after a dose (possible severe allergic reaction)",
      "Chest pain, fainting, or a racing/irregular heartbeat",
      "Confusion, severe drowsiness, or unresponsiveness",
      "Signs of overdose — vomiting, seizures, or extreme weakness",
    ],
    emergency:
      "If you have signs of a severe drug reaction or overdose, call 112 (national emergency) or 108 (ambulance) and go to the nearest emergency room immediately.",
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
      "Answer an in-depth lifestyle questionnaire and receive a multi-layered cancer-risk assessment: a colour-coded risk meter, top contributing factors, organ impact, a step-by-step diagnostic roadmap with costs, and a Cancer Prevention Score.",
    icon: ShieldAlert,
    accent: "pulse",
    howItWorks: [
      "Answer detailed questions about lifestyle, exposure and family history",
      "AI weighs your answers against your saved health profile",
      "Get a risk meter, prevention score and a costed diagnostic roadmap",
    ],
    disclaimer:
      "CancerSense gives a statistical, educational estimate only — it cannot diagnose cancer. A low result is not a guarantee of health and a high result is not a diagnosis. Only clinical screening and a qualified oncologist can confirm any condition.",
    redFlags: [
      "Unexplained weight loss, persistent fatigue, or night sweats",
      "A new lump, or a mole that is changing, bleeding or growing",
      "Coughing up blood, blood in stool or urine, or unusual bleeding",
      "A sore, ulcer or cough that does not heal for more than 3 weeks",
    ],
    emergency:
      "These are warning signs to get checked quickly — book an oncologist or your doctor without delay. For heavy bleeding or collapse, call 112 or 108 now.",
    cta: "Assess my risk",
    fields: [
      { name: "smoking", label: "Tobacco use (smoking, chewing, gutka)", type: "select", options: ["Never", "Former", "Occasional", "Daily"] },
      { name: "alcohol", label: "Alcohol", type: "select", options: ["None", "Occasional", "Weekly", "Daily"] },
      { name: "red_meat", label: "Red / processed meat more than 3×/week?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "fruit_veg", label: "Fruits & vegetables daily?", type: "select", options: ["Daily", "Sometimes", "Rarely"] },
      { name: "water", label: "Water per day", type: "select", options: ["Less than 1L", "1–2L", "More than 2L"] },
      { name: "night_shift", label: "Do you work night shifts?", type: "select", options: ["No", "Sometimes", "Regularly"] },
      { name: "chemical_exposure", label: "Exposed to chemicals, pesticides or industrial fumes at work?", type: "select", options: ["No", "Occasionally", "Daily"] },
      { name: "sun_exposure", label: "Prolonged daily sun exposure without sunscreen?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "activity", label: "Physical activity", type: "select", options: ["Active most days", "Sometimes", "Rarely"] },
      { name: "prior_diagnosis", label: "Previous cancer diagnosis or biopsy?", type: "text", placeholder: "e.g. none / breast biopsy 2021" },
      { name: "family_cancer", label: "Family history of cancer", type: "text", placeholder: "e.g. mother — breast cancer" },
      { name: "women_history", label: "For women — periods, pregnancies, breastfeeding, contraceptive use", type: "textarea", placeholder: "e.g. first period age 12, 2 pregnancies, breastfed, on OCP 3 yrs", voice: true },
      { name: "symptoms", label: "Any persistent symptoms?", type: "textarea", placeholder: "Unexplained weight loss, lumps, persistent cough…", voice: true },
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
      "SenseCheck is a preliminary screening aid only and cannot replace an eye test by an optometrist or a hearing test by an audiologist.",
    redFlags: [
      "Sudden loss of vision or hearing in one or both sides",
      "Sudden double vision, a curtain/shadow over your sight, or flashes and a shower of floaters",
      "Eye pain with redness, nausea or halos around lights",
      "Vision or hearing loss with weakness, slurred speech or facial droop (possible stroke)",
    ],
    emergency:
      "Sudden vision or hearing loss is a medical emergency — go to the nearest emergency room or call 112 / 108 immediately. Do not wait.",
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
      "Take a photo of any meal and get an instant nutrient breakdown plus a Sugar Impact Index, Glycemic Index & Load and a Safe/Caution/Avoid verdict — with extra diabetic warnings if your profile flags diabetes.",
    icon: Camera,
    accent: "warning",
    howItWorks: [
      "Upload or snap a photo of your meal",
      "AI estimates calories, protein, sugar, sodium plus Sugar Impact Index, GI & GL",
      "It's saved to your diary to track weekly health and diabetes risk",
    ],
    disclaimer:
      "CalorieEye gives approximate nutritional estimates from a photo and may be inaccurate for hidden ingredients, oils and portion sizes. Do not rely on it for medical diets — consult a registered dietitian or diabetologist for clinical nutrition needs.",
    redFlags: [
      "Symptoms of very high blood sugar — extreme thirst, frequent urination, blurred vision, fruity breath, confusion",
      "Symptoms of low blood sugar — shakiness, sweating, dizziness, confusion or fainting",
      "Chest pain or breathlessness after eating",
    ],
    emergency:
      "Diabetic emergencies (very high or very low sugar with confusion or fainting) need urgent care — call 112 / 108 or go to the nearest emergency room.",
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
    redFlags: [
      "A mole that is asymmetric, has irregular borders, multiple colours, is larger than 6mm, or is changing (the ABCDE signs)",
      "A sore or spot that bleeds, crusts or does not heal",
      "Rapidly spreading redness, swelling and fever (possible serious skin infection)",
      "Painful blistering over a large area",
    ],
    emergency:
      "A fast-spreading, painful or infected skin area with fever needs urgent care — call 112 / 108 or go to the nearest emergency room. For suspicious moles, see a dermatologist promptly.",
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
    redFlags: [
      "Tampered or broken packaging, mismatched batch/expiry, or spelling errors on the pack",
      "Unusual colour, smell, taste or texture of the medicine",
      "You already took a medicine you now suspect is fake or expired and feel unwell",
    ],
    emergency:
      "If you feel unwell after taking a suspected counterfeit or expired medicine, call 112 / 108 or go to the nearest emergency room and bring the pack with you.",
    cta: "Verify medicine",
    fields: [
      { name: "batch_number", label: "Batch number", type: "text", placeholder: "As printed on the pack", required: true },
      { name: "medicine_name", label: "Medicine name", type: "text", placeholder: "e.g. Azithromycin 500" },
      { name: "expiry", label: "Printed expiry", type: "text", placeholder: "e.g. 08/2026" },
      { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "e.g. Cipla" },
    ],
  },
  {
    slug: "sugarsense",
    name: "SugarSense",
    tagline: "See what sugar is really doing to you",
    description:
      "A diabetes & sugar-impact detector. Answer a quick questionnaire to find your diabetes risk, then learn the Sugar Impact Index of foods, organ-level damage, your daily sugar budget and safer Indian alternatives.",
    icon: Droplets,
    accent: "warning",
    howItWorks: [
      "Answer simple questions about symptoms and habits",
      "AI estimates your diabetes / pre-diabetes risk against your profile",
      "Get your sugar budget, organ-impact explainer and safer swaps",
    ],
    disclaimer:
      "SugarSense is an AI-generated awareness assessment only and cannot diagnose diabetes. Only an HbA1c or fasting glucose blood test ordered by a doctor can confirm diabetes. Please consult a certified diabetologist or endocrinologist before making medical decisions.",
    redFlags: [
      "Extreme thirst with frequent urination, rapid weight loss and exhaustion",
      "Fruity-smelling breath, deep rapid breathing, nausea or vomiting (possible diabetic ketoacidosis)",
      "Confusion, drowsiness or fainting",
      "A non-healing foot wound, ulcer or spreading infection",
    ],
    emergency:
      "Fruity breath, vomiting, confusion or fainting can signal a diabetic emergency — call 112 / 108 or go to the nearest emergency room immediately.",
    cta: "Check my sugar risk",
    fields: [
      { name: "thirst", label: "Very thirsty even after drinking water?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "urination", label: "Urinate more than 6–7 times a day?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "fatigue", label: "Tired / fatigued without much work?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "vision", label: "Vision become blurry recently?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "healing", label: "Wounds or cuts take longer to heal?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "numbness", label: "Tingling or numbness in hands/feet?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "hunger", label: "Hungry very often even after eating?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "family_diabetes", label: "Family history of diabetes?", type: "select", options: ["No", "Yes", "Not sure"] },
      { name: "sweets", label: "Sweets or soft drinks daily?", type: "select", options: ["No", "Sometimes", "Daily"] },
      { name: "foods", label: "Foods/drinks you want a Sugar Impact check on (optional)", type: "textarea", placeholder: "e.g. cold drink, 2 rasgullas, chai with sugar", voice: true },
    ],
  },
  {
    slug: "heartsense",
    name: "HeartSense",
    tagline: "Catch silent heart conditions early",
    description:
      "A silent heart-condition detector. Answer questions people never connect to their heart, plus family history, to screen for hidden conditions like ASD, valve defects and arrhythmia — with a risk flag and a costed diagnostic roadmap.",
    icon: HeartPulse,
    accent: "pulse",
    howItWorks: [
      "Answer questions about breathlessness, palpitations and family history",
      "AI screens for silent congenital and acquired heart conditions",
      "Get a risk level and an ECG/Echo diagnostic roadmap with costs",
    ],
    disclaimer:
      "HeartSense is an educational screening aid and cannot diagnose any heart condition. Only an ECG, echocardiogram and a qualified cardiologist can confirm a diagnosis. Never ignore symptoms because of a low result.",
    redFlags: [
      "Chest pain or pressure, especially spreading to the arm, jaw or back",
      "Severe breathlessness at rest, or fainting during/after exertion",
      "Bluish lips or fingertips",
      "A very fast, very slow or irregular heartbeat with dizziness",
    ],
    emergency:
      "Chest pain, fainting or bluish lips can signal a heart emergency — call 112 / 108 or go to the nearest emergency room immediately. Do not drive yourself.",
    cta: "Screen my heart",
    fields: [
      { name: "breathless", label: "Breathless climbing just one floor?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "palpitations", label: "Heart racing or fluttering at rest?", type: "select", options: ["No", "Sometimes", "Often"] },
      { name: "swelling", label: "Swelling in ankles/feet or sudden weight gain?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "murmur", label: "Did a doctor ever mention a heart murmur?", type: "select", options: ["No", "Yes", "Not sure"] },
      { name: "cyanosis", label: "Lips or fingertips turn bluish during exertion?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "tire_easily", label: "Tire much faster than others during exercise?", type: "select", options: ["No", "Sometimes", "Yes"] },
      { name: "fainting", label: "Ever fainted during or after physical activity?", type: "select", options: ["No", "Once", "More than once"] },
      { name: "family_heart", label: "Family congenital heart disease or sudden death under 50?", type: "text", placeholder: "e.g. uncle — sudden death at 45" },
      { name: "rheumatic", label: "History of rheumatic fever as a child?", type: "select", options: ["No", "Yes", "Not sure"] },
      { name: "notes", label: "Anything else about your heart?", type: "textarea", placeholder: "Told something about your heart at birth, dizziness, etc.", voice: true },
    ],
  },
  {
    slug: "scaniq",
    name: "ScanIQ",
    tagline: "Understand your scan or report instantly",
    description:
      "Upload an X-ray, MRI, CT scan image or a PDF report (blood, ECG, pathology). ScanIQ explains every finding in plain language, flags an urgency level, lists possible conditions and gives a clear, costed next-step plan.",
    icon: ScanLine,
    accent: "primary",
    howItWorks: [
      "Upload a scan image or a PDF medical report",
      "AI reads it and translates the jargon into plain language",
      "Get a 5-part report: findings, urgency, conditions, next steps and trends",
    ],
    disclaimer:
      "ScanIQ provides educational analysis to help you understand your medical reports. It is not a substitute for professional medical diagnosis and can misread images or reports. Always have a qualified doctor confirm the findings before making any medical decision.",
    redFlags: [
      "An Urgent or Emergency urgency level in your result",
      "Findings such as a possible bleed, clot, large mass, fluid around the lungs or heart, or critically abnormal blood values",
      "Severe symptoms accompanying the report — chest pain, breathlessness, severe pain or confusion",
    ],
    emergency:
      "If ScanIQ flags an Urgent or Emergency level — or you have severe symptoms — go to the nearest emergency room or call 112 / 108 immediately. Bring the scan or report with you.",
    cta: "Analyze my scan",
    fields: [
      { name: "file", label: "Scan image or PDF report", type: "file", required: true },
      { name: "scan_type", label: "What is this?", type: "select", options: ["Chest X-Ray", "Bone X-Ray", "CT Scan", "MRI Scan", "Blood Report", "ECG Report", "Urine Report", "Pathology Report", "Other"] },
      { name: "context", label: "Symptoms or context (optional)", type: "textarea", placeholder: "Why was this taken? Any symptoms?", voice: true },
    ],
  },
];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolName(slug: string): string {
  return TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}
