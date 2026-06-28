# 🏥 Nirogi AI — India's Personal Health Operating System

> **"Catch it before it's too late."**

**Live Demo:** [nirogi-healthai.lovable.app](https://nirogi-healthai.lovable.app)

Submitted for **India Runs by Redrob AI — Track 2: Ideathon (Everyday AI Innovator)**

---

## 🌟 What is Nirogi AI?

Nirogi AI is India's first AI-powered Personal Health Operating System — 12 free AI health tools built for every Indian, from metro cities to remote villages. No doctor appointment. No expensive tests. No English required.

Built from two real family experiences:
- **Grandfather** took painkillers for years → developed liver cirrhosis. Nobody warned him. **MedGuard** would have caught this in minutes.
- **Uncle** lived with a heart hole (ASD) undetected for 30–40 years. **HeartSense** would have flagged it in 5 minutes.

---

## 🛠️ The 12 AI Tools

| # | Tool | What It Does |
|---|---|---|
| 1 | **MedGuard** | Medicine side effect checker — flags drug interactions at short, medium & long term |
| 2 | **CancerSense** | Lifestyle-based cancer & tumour risk predictor with Cancer Prevention Score |
| 3 | **SenseCheck** | Voice-powered vision & hearing diagnostic — ElevenLabs AI narration + distance detection |
| 4 | **CalorieEye** | AI food scanner — identifies Indian food, tracks weekly disease risk |
| 5 | **SkinScan** | AI skin disease detector via photo — Safe to Urgent severity classification |
| 6 | **MedVerify** | Medicine batch authenticator — cross-checks CDSCO database for recalls & expiry |
| 7 | **SugarSense** | Diabetes detection + Sugar Impact Index for Indian foods (rasgulla, cold drinks, chai) |
| 8 | **HeartSense** | Silent heart condition detector — ASD, VSD, arrhythmia, valve prolapse screening |
| 9 | **ScanIQ** | X-Ray, MRI, CT scan & medical report analyser — translates jargon to plain language |
| 10 | **IngredientScan** | Harmful ingredient analysis — rates every ingredient Safe / Caution / Avoid / Harmful |
| 11 | **DietPlan AI** | 7-day personalised Indian meal plan with portions, calories, prep time & cost |
| 12 | **WeightGoal** | Target weight/BMI tracker — safe calorie deficit, weekly progress, timeline projection |

---

## 🏗️ Architecture & Tech Stack

```
Frontend:        React (TypeScript) + TanStack Router + Tailwind CSS
Backend:         Supabase Edge Functions (Deno)
AI Engine:       Anthropic Claude claude-sonnet-4-6 via Messages API
Auth:            Supabase Auth (Google OAuth)
Database:        Supabase PostgreSQL (Row Level Security)
Hosting:         Lovable.dev → Netlify CDN
```

### How AI Works in Nirogi AI

Each tool sends a structured prompt to Claude claude-sonnet-4-6 via the Anthropic API:

```typescript
// src/lib/health-tools.server.ts
export function buildToolPrompt(slug: string, profile: HealthProfile): string {
  switch (slug) {
    case "medguard":
      return `You are MedGuard, an expert pharmacologist for Indian patients...
              User profile: ${JSON.stringify(profile)}
              Analyse the medicine and return structured findings with riskLevel,
              findings[], warnings[], recommendations[], and nextSteps[]`;
    // ... 12 tools total
  }
}
```

All 12 tools return a **standardised JSON response** with:
- `riskLevel`: `"info" | "low" | "moderate" | "high" | "critical"`
- `findings[]`: Array of specific findings
- `warnings[]`: Red flag alerts
- `recommendations[]`: Actionable next steps
- `nextSteps[]`: Specialist referrals with estimated INR costs

---

## 🎯 Key Features

### Personal Health OS Dashboard
- **Health Score** — One number out of 100 from 4 pillars: Physical Activity (25) + Hydration (25) + Sleep Quality (25) + Personal OS (25)
- **Family Profiles** — Each member signs in with own Google account, full independent profile switching
- **Medicine Reminders** — Service Worker push notifications, fire even when browser is closed
- **Prescription Auto-Reader** — Upload prescription photo → AI reads all medicines → asks approval → sets reminders

### Phone-Native Wellness Tracking
- **Exercise Tracker** — 87 activities (full Apple Watch parity) tracked via phone GPS, accelerometer, gyroscope
- **Sleep Tracker** — Phone microphone records sleep sounds, AI detects snoring & sleep apnea
- **Water Tracker** — Service Worker reminders, daily/weekly/monthly hydration reports
- **Android Health Connect** — Syncs Samsung Health, Fitbit, Garmin, Mi Band, Google Fit — 500+ devices in one connection

### Clinical-Depth Reports
- **SenseCheck Hearing** — 8-round ElevenLabs voice test (word accuracy, frequency range, tinnitus, left vs right ear)
- **SenseCheck Vision** — Distance detection via face size calculation, Snellen equivalent acuity, colour blindness, glaucoma risk
- **ScanIQ** — Translates medical jargon to plain Hindi/English, 5-section report with urgency flags
- **IngredientScan** — India-specific alerts: TBHQ in Maggi, vanaspati/dalda, maida, hidden sugar names

### Trust & Safety
- Every result ends with: *"This is an AI-generated assessment for awareness only. Please consult a certified doctor."*
- Emergency SOS button on every page — 108, 112, NIMHANS numbers, nearest hospital GPS
- Data sources: WHO, Harvard Medical School, CDSCO, ICMR, peer-reviewed journals

---

## 📊 Real-World Validation

**ScanIQ tested with real NIH Chest X-Ray Dataset:**
- Uploaded a real chest X-ray (NORMAL-1110860-0001.jpeg from NIH dataset)
- Correctly identified: Normal lung fields, normal heart size, no fractures
- Urgency: NORMAL — No immediate action needed
- Recommendation: General Physician for routine follow-up

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/adityaduggiralaonein-dot/nirogi-healthai-51b49473.git
cd nirogi-healthai-51b49473

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL, Supabase Anon Key, and Anthropic API Key

# Run development server
npm run dev
```

### Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── tools/          # ToolRunner, ToolCard, result renderers
│   ├── home/           # Hero, Features, FAQ components
│   ├── dashboard/      # Health Score, Profile, Family Profiles
│   └── ui/             # shadcn/ui component library
├── lib/
│   ├── tools.tsx           # All 12 tool definitions, fields, disclaimers
│   ├── health-tools.server.ts  # AI system prompts for each tool
│   └── health-tools.functions.ts  # API call handlers
├── routes/
│   ├── index.tsx           # Homepage
│   ├── tools.$slug.tsx     # Dynamic tool pages
│   ├── dashboard.tsx       # Health OS dashboard
│   └── auth.tsx            # Google OAuth
└── supabase/
    └── migrations/         # Database schema (profiles, tool_runs, families)
```

---

## 🇮🇳 India-First Design Choices

| Feature | Why India-Specific |
|---|---|
| Sugar Impact Index | Shows impact of rasgulla (88/100), cold drinks (95/100), chai with sugar (55/100) |
| IngredientScan India Alerts | Flags maida, vanaspati/dalda, TBHQ in Maggi, artificial colours in mithai |
| Hindi Language Support | Full UI translation + SenseCheck voice AI in Hindi |
| INR Cost Estimates | Every diagnostic recommendation includes cost in Indian Rupees |
| CDSCO Integration | MedVerify checks India's Central Drugs Standard Control Organisation database |
| Rural-first Voice | SenseCheck is fully voice-powered — no reading or typing needed |
| Low-end device support | Works on any Android phone — no smartwatch required |

---

## 📈 Impact

- **12 AI tools** covering medicine safety, cancer risk, diabetes, heart conditions, skin, vision, hearing, nutrition, weight, and medical scans
- **₹0** cost to every user — no paywall, no ads, no subscription
- **10M+ Indians** targeted in underserved rural and semi-urban areas
- **500+ wearables** supported via Android Health Connect integration
- **24/7 availability** — no doctor appointment needed

---

## 🏆 Hackathon Submission

**Event:** India Runs by Redrob AI  
**Track:** Track 2 — Ideathon, Challenge 3: Everyday AI Innovator  
**Live URL:** [nirogi-healthai.lovable.app](https://nirogi-healthai.lovable.app)  
**Team:** Aditya Duggirala  

---

## ⚠️ Medical Disclaimer

Nirogi AI is an educational health awareness platform. All AI-generated results are for informational purposes only and do not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making any medical decisions.

In case of emergency, call **112** (National Emergency) or **108** (Ambulance).

---

*Built with ❤️ for India. Catch it before it's too late.*
