## Nirogi AI — New Tools, History & UX Upgrades

This builds on the existing platform. No database schema changes are needed — the `scan_history`, `food_diary`, and `profiles` tables and the private `prescriptions` bucket already cover everything. All work stays in frontend + server-function code.

### 1. Header logo + animated heart
- Enlarge the header logo from `h-9 w-9` to a bolder `h-11 w-11` (≈44px) with the wordmark slightly larger, keeping the sticky glass header.
- Apply the existing `animate-heartbeat` pulse to the logo mark so the heart visibly beats in the header.
- Confirm the Hero ECG line keeps animating (`ecg-line` keyframes already exist) and add the heartbeat pulse to the Hero heart graphic.

### 2. Three new tools (brings total to 9)
Added to the tool registry and the unified ToolRunner (no per-tool pages needed):

- **SugarSense** (#7) — Diabetes & Sugar Impact Detector. Questionnaire (thirst, urination, fatigue, blurry vision, slow healing, numbness, hunger, family history, BMI auto-noted, daily sweets/soft drinks). Output: one of four risk verdicts, Sugar Impact Index education, organ-level damage explainer, daily sugar budget, and safer Indian-food alternatives.
- **HeartSense** (#8) — Silent Heart Condition Detector. Questionnaire (breathlessness on one floor, palpitations, swelling, murmur history, bluish lips, fatigue) + family/personal history. Output: risk level + urgency flag, conditions screened (ASD, VSD, valve prolapse, arrhythmia, etc.), and an ECG/Echo/Holter diagnostic roadmap with INR cost ranges.
- **ScanIQ** (#9) — Medical Scan & Report Analyser. Upload an X-ray/MRI/CT image **or a PDF report**. Output follows the doc's 5 sections: What Was Found (jargon → plain language), colour-coded Urgency Level (Normal→Emergency), Possible Conditions, What To Do Next (specialist + tests + INR cost), and trend note vs prior reports. Each ScanIQ run is saved to history.

### 3. Upgrade existing tools
- **CancerSense**: expanded questionnaire (red/processed meat, fruit & veg, water, night shifts, chemical exposure, tobacco forms, prior biopsy, sun exposure, women's reproductive history). Deeper prompt → risk meter (Low/Moderate/High/Critical), top contributing factors, organ-impact notes, a step-by-step diagnostic roadmap with costs, and a Cancer Prevention Score (out of 100) with 3 weekly actions.
- **CalorieEye**: add Sugar Impact Index (0–100, colour-coded), Glycemic Index / Glycemic Load with Safe/Caution/Avoid labels, and Diabetic Mode (extra warnings when the profile marks diabetes/pre-diabetes). Nutrition strip extended to show the sugar-impact score.

### 4. Strengthen disclaimers (every tool)
- Add `redFlags` (symptoms that mean "stop and seek care now") and an `emergency` block to each tool definition.
- New shared `ClinicalDisclaimer` component shown on every tool page and in each result: prominent warning styling, tool-specific red-flag list, and India emergency resources (call **112** national / **108** ambulance, plus "go to the nearest emergency room"). Reinforce "AI is educational, not a diagnosis."

### 5. Prescription reader — step-by-step status UI
Replace the single upload box in the dashboard with a guided flow component showing clear stages:
```text
[1 Select file] → [2 Uploading] → [3 Reading text] → [4 Analyzing] → [5 Done / Error]
```
- Visual stepper with progress, per-stage spinners, and explicit, friendly error messages (file too large, unreadable image, rate limit, AI unavailable) each with a Retry action.
- Accept image or PDF. Each analysis is saved to history (tool = `prescription`) with a timestamp so it appears on the new History page; latest summary still shows on the dashboard.

### 6. Medical report history page
- New route `/_authenticated/history` (linked from the dashboard and header when signed in).
- Lists past tool runs, prescription analyses, and meal scans newest-first with timestamps, tool name, risk badge, and a short summary; clicking expands the full saved output.
- Backed by a new `getMyHistory` server function reading `scan_history` (and `food_diary` for meals), all scoped to the signed-in user via existing RLS.

### 7. Site copy refresh
Update "six tools" → "nine tools" across the Hero, tools section heading, stats, and FAQ; add the three new tool cards to the homepage grid.

---

### Technical notes
- **Tool registry** (`src/lib/tools.tsx`): extend `ToolField` to support a `file` type (image + PDF). Extend `ToolDef` with `redFlags: string[]` and `emergency: string`. Add SugarSense, HeartSense, ScanIQ; update CancerSense & CalorieEye fields/disclaimers.
- **AI layer** (`src/lib/health-tools.server.ts`): add per-tool prompts for the new/upgraded tools; extend `callHealthAI` to accept a PDF `file` content part (`{type:"file",file:{filename,file_data}}`) in addition to images; add optional `sugarImpact`/`prevention`/`urgency` fields to `ToolResult` and render them in `ToolRunner`.
- **Server fns**: `runTool` already persists to `scan_history`; pass through PDF data. Add `getMyHistory` in a new `history.functions.ts`. Update `analyzePrescription` to also insert a `scan_history` row.
- **Components**: new `ClinicalDisclaimer`, new `PrescriptionAnalyzer` (stepper), new history route; minor edits to `Header`, `Hero`, `ToolRunner`, `dashboard.tsx`, `index.tsx`.
- All server functions stay under `requireSupabaseAuth`; `attachSupabaseAuth` is already wired in `start.ts`. No migration required.
