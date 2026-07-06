# Nirogi — Spec-aligned Modules, Devices, Doctors (Priorities 1–6)

Built to match the two Word specs. Every module page follows the doc's rule set: back arrow, real data only (localStorage/sensors — never fake numbers), 7‑day Recharts trend, "Log manually" button, a "Data source" footer, and a Lovable‑AI insight box. Empty state: *"No data yet. Enable a data source below or log manually."*

## Priority 1 — Reorganise & rebuild trackers into real tracker pages

**Move out of the main 9 tools → dedicated Health‑Module pages** (no more questionnaire `ToolRunner` for these). Each gets its own route, manual logging, trend chart, and AI insight:

- Stress & Mind → `/dashboard/stress` (mood emoji check‑in, 4‑7‑8 breathing link, journal, 7‑day mood calendar)
- Blood Glucose → `/dashboard/glucose` (fasting/post‑meal logs, colour bands 70‑99 / 100‑125 / ≥126, HbA1c estimate)
- Temperature → `/dashboard/temperature` (°C/°F log, fever bands)
- Bone & Joint → `/dashboard/bone-health` (pain/mobility check‑in + AI guidance)
- Biological Age → `/dashboard/bio-age` (weighted model from RHR, sleep, BMI, steps, glucose, stress → age offset)

Remove `stresssense/glucotrack/thermocheck/bonehealth/bioage` from the `TOOLS` array and the `/tools/$tool` path; delete `sensecheck` from the Goals & Wellness row (Eye Strain + Hearing modules already cover that).

**Upgrade the existing weak trackers to the doc spec:**

- Sleep `/dashboard/sleep` — last‑night card (hours, efficiency %), stage donut, quality 1‑5, manual bedtime/wake entry, optional mic "sleep recording" toggle, `nirogi_sleep_logs`.
- Fitness `/dashboard/fitness` — accelerometer step counter (DeviceMotionEvent), ring toward 8,000, calories via MET, activity selector, 7‑day steps bar chart, `nirogi_fitness_logs`.
- Water `/dashboard/water` — preset 150/250/500/custom, animated fill, goal = weight×35 ml, reminder‑interval editor, hydration badge.
- Weight & BMI `/dashboard/weight` — kg entry, BMI ring + category colours, target weight + progress, 30‑day trend (merge with existing Goals logic).

## Priority 2 — Remaining modules (build to spec)

- Blood Oxygen `/dashboard/spo2` — keep camera PPG, add colour bands + altitude note.
- UV & Skin Exposure `/dashboard/uv-exposure` — GPS + Open‑Meteo `uv_index`, colour band, SPF advice, skin‑type selector, weekly chart.
- **Energy & Recovery** `/dashboard/energy` (new card) — composite 0‑100 from sleep 30% / stress 25% / steps 20% / hydration 15% / nutrition 10%, emoji tier, factor breakdown, 14‑day trend.
- Hearing `/dashboard/hearing-health` and Eye Strain `/dashboard/eye-strain` — keep, align to doc (dB meter / 20‑20‑20).
- Menstrual `/dashboard/menstrual` and Altitude `/dashboard/altitude` — noted as later‑priority; scaffolds only if time permits (flagged, not blocking).

Dashboard "Health modules" grid re‑pointed to all the new routes with correct icons.

## Priority 3 — Connected Devices card `/dashboard/devices`

Three tabs (already partly built, completed to spec):

- **Phone Sensors** — GPS, Accelerometer, Mic, Rear/Front camera, Barometer, Notifications; each with Enable toggle that requests permission only on tap; status saved to `nirogi_devices_config`.
- **Android Health Connect** — Android detection + "Install Nirogi Sync app (coming soon)" best‑effort path with data‑type list.
- **Google Fit** — "Connect Google Fit" OAuth implicit button reading `VITE_GOOGLE_FIT_CLIENT_ID`; `/auth/google-fit` callback stores token; button shows "Add client ID to enable" until the key is provided (best‑effort as agreed). Connection status shown per tab.

## Priority 4 — Health Score rework + Prescription→Reminder flow

- Rework `health-score.functions.ts` to the doc's pillar model (Physical / Hydration / Sleep / Personal‑OS) blending module localStorage summaries the client passes in, keeping the DB snapshot history. Health Score card shows pillar bars.
- **Prescription approval:** after `analyzePrescription`, AI also returns a structured medicine list; the dashboard shows each detected medicine with an **"Add as reminder"** confirm step (user approves before anything is saved to `medicine_reminders`). Add **"Clear prescription"** to wipe the stored analysis and upload a fresh one.

## Priority 5 — PWA logo + intro animation

- Wait for your uploaded logo, then generate `icon-192`/`icon-512` (maskable), apple‑touch icon, and splash from it; update `manifest.webmanifest` (name "Nirogi AI", theme `#00E5C3`, bg `#060B18`).
- Add a one‑time framer‑motion splash/intro (logo reveal) on app launch in standalone mode.

## Priority 6 — AI Doctor Avatar system (first version, full stack)

- Enable the **ElevenLabs** connector (voice) and add `@react-three/fiber`, `@react-three/drei`, `@readyplayerme/visage` for 3D avatars.
- 12 doctor profiles (name, specialty, personality, connected tools, RPM avatar URL, ElevenLabs voice) in a config module.
- Dashboard **"My Doctors"** swipeable row (below Health Score) → doctor page `/dashboard/doctor/$id` with large 3D avatar (idle/talking states), bio, Start Chat + Voice Call.
- **Chat:** Lovable AI, per‑doctor system prompt + injected profile, history saved to a new `doctor_chats`/`doctor_messages` table (Cloud). **Voice:** ElevenLabs TTS + Web Speech input.
- **Credit system:** `user_credits` + `credit_transactions` tables, signup/tool/streak earning, 1 credit/message & 5/min voice, credit pill in nav, low‑credit nudge, zero‑credit modal (no hard paywall). Tool‑result "Discuss with Dr. X" banner routing.

## Later (as you ordered) — not in this shipment

- Priority 7 (family Google‑sign‑in completion) and Priority 8 (delete SkinScan images immediately after scan).

## Technical notes

- New DB migrations: `doctor_chats`, `doctor_messages`, `user_credits`, `credit_transactions` — all with GRANTs + RLS scoped to `auth.uid()`. Server functions via `createServerFn` + `requireSupabaseAuth`.
- All sensor/measurement data stays in localStorage per the privacy spec; only summarised numbers go to Lovable AI.
- ElevenLabs voice runs through a server route using the connector `ELEVENLABS_API_KEY` (never client‑side).
- Reuse `ModuleLayout`, `TrendCard`, `AiResultPanel`, `ClinicalDisclaimer`, i18n `t()`; verify with a typecheck/build and Playwright smoke of key new pages.

**Scope note:** Priorities 1–6 are a very large single shipment. If any piece must slip, Menstrual/Altitude scaffolds and RPM avatar polish are the first candidates — the doctor chat, voice, credits, all tracker rebuilds, devices, health score, prescription flow, and PWA logo are the committed core. Also give an option for me to upload logo . like you tell upload the logo here.