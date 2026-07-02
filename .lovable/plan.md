## Goal

Deliver the Nirogi V2 + Unified upgrades using pragmatic web equivalents (per your answers): no Android Health Connect / background hardware sensors, but live in-browser capture during a session, AI-scored voice tests, camera pulse, and per-member Google sign-in.

## 1. CalorieEye upgrade — ingredient scanner + goals

- Add a second mode to CalorieEye: **"Scan a food label / ingredient list"** (photo of packet).
  - AI returns a **product score 0–10** (Excellent → Dangerous) with grade, a **per-ingredient table** (name · Safe/Caution/Harmful · plain-language reason · disease risk · found-in), and **India-specific alerts** (maida, vanaspati/trans-fat, palm oil, excess sodium/sugar).
  - Results are **personalised against the profile** (diabetic → sugar/maida flags, heart/BP → sodium & sat-fat, kidney, allergies, child profile, etc.).
- Existing "meal photo" calorie flow stays; the label result is saved to history and shown with Download/Copy/WhatsApp actions.

## 2. Health Goals (Personal OS)

- New **"Set my health goals"** card on the dashboard: goal type (Lose / Gain / Build muscle / Maintain / child Height goal), current & target weight/height, timeline.
- AI computes a safe **daily calorie target** (±deficit/surplus, protein target for muscle) that CalorieEye uses as its budget and warns against.
- Weekly **weigh-in logging** with a progress-vs-target graph, BMI auto-update, and milestone messages (25/50/100%).

## 3. Diet Plan Generator + Upload (Personal OS)

- **Generate**: short questionnaire (goal, conditions auto-filled, veg/non-veg, regional cuisine, budget, allergies, cooking time, headcount) → AI produces a **7-day plan** (breakfast/lunch/dinner/snack, portions, calories, sugar load, cost) saved to the dashboard with **tick-off compliance**.
- **Upload**: user uploads a doctor/trainer plan (image/PDF/text); AI extracts meals for confirmation, then activates it. Harmful items flagged against the profile.
- New `/diet-plan` page; today's meals surface on the dashboard.

## 4. SenseCheck rebuilt — voice-guided (new `/sense-check` page)

- **Hearing**: AI voice narrates tones/words at varying volume/pitch; the mic + speech recognition captures the user's repeat-back; AI scores accuracy → clinical hearing summary.
- **Vision**: on-screen acuity/contrast/colour chart calibrated to a **self-entered viewing distance**; user reports what they see; AI scores.
- Uses Lovable AI text-to-speech + transcription for quality. Falls back to typed answers if mic/permissions denied. Keeps the compact disclaimer + red-flag triangle dialog.

## 5. New dashboard tools with their own pages

- **HeartRhythm** (`/heart-rhythm`): camera **finger-on-lens PPG** measures resting heart rate over ~30s, shows a live pulse waveform, logs BPM, and gives an AI rhythm note (clearly "not a medical ECG").
- **BreatheEasy** (`/breathe`): animated guided breathing (Box, 4-7-8, Calm) with timers, haptic/visual pacing, and session logging.
- Both appear as cards in the dashboard Wellness section and open as full pages, matching the teal/emerald + Sora/Manrope style.

## 6. Tracker upgrades (Water / Exercise / Sleep)

- **Water**: service-worker–based reminders (PWA) at a chosen interval, quick-sip buttons, streak; goal from settings.
- **Exercise**: optional **live GPS session** (distance, pace, route length) + motion-based step/intensity estimate during an active workout, plus the existing MET sports library for manual logs.
- **Sleep**: keep bed/wake logging + AI quality analysis; restyle to match site.
- All three restyled for consistent cards, motion reveals, and empty states.

## 7. Invite-link family sign-in (own Google account, private data)

- Owner generates an **invite link** for a family member from the Family card.
- Member opens the link → signs in with **their own Google account** → gets their **own private profile, trackers, and tool history**.
- Owner's Family card shows the member's name/relation and **joined status only**; the member's detailed health data stays private to them.
- Local (owner-managed) family profiles remain for members who don't have their own login.

## 8. Health Score rebuild

- Recompute around activity: **Physical/Exercise, Hydration, Sleep, and Personal-OS (profile + goals + diet compliance + adherence + risk tools)**, with weekly trend retained.

## Technical notes

- **DB migrations**: `health_goals`, `weight_logs`, `diet_plans`, `breathing_sessions`, `heart_rate_logs`, `family_invites` (token, owner, status, linked member/user), and a `member_user_id` link on `family_members`; extend `wellness_settings` with water-reminder interval; reuse `scan_history`/`food_diary` for ingredient scans. Each new table gets GRANTs + RLS scoped to `auth.uid()`.
- **Server fns**: `goals.functions.ts`, `diet.functions.ts` (+`.server.ts`), `family-invite.functions.ts`, `voice.functions.ts` (Lovable AI TTS/STT), plus additions to `health-tools.server.ts` (CalorieEye ingredient + SenseCheck scoring) and `wellness.functions.ts`.
- **AI**: Lovable AI Gateway (vision for labels, TTS `gpt-4o-mini-tts`, transcription `gpt-4o-mini-transcribe`); Hindi output honoured via existing i18n `lang` passthrough.
- **Auth**: Google/Apple already configured; invite acceptance links the new auth user to the family record after the session hydrates on a public callback route.
- **Routes added**: `/sense-check`, `/heart-rhythm`, `/breathe`, `/diet-plan`, `/goals` (or dashboard-embedded), `/invite/$token`.
- New tools also registered in `src/lib/tools.tsx` where they should appear in the tools grid; disclaimers/red-flags kept in the current compact style.

## Most important (should be done immediately)

- Android Health Connect / Fitbit/Samsung sync, always-on background step counting when the app is closed, and true medical-grade ECG — these need a native mobile app. HeartRhythm and the trackers are clearly labelled as estimates.

## Verification

- Typecheck/build clean; Playwright smoke test of each new page (camera/mic permission fallbacks), invite-accept flow, diet-plan generation, and dashboard rendering.