# Nirogi — Devices, new tools, family invite & SenseCheck (single shipment)

Four priorities, all reusing the existing website style (Sora/Manrope, teal/emerald tokens, `SiteLayout`, `ClinicalDisclaimer`, `ReportActions`, the `runTool` AI pipeline, Recharts). No new DB tables — new modules persist per-user via localStorage; AI insight reuses the existing gateway.

## Priority 1 — Connected Devices card + page

- **Dashboard card:** add an "Integrations & devices" card to `dashboard.tsx` (next to the Goals/wellness grid) linking to a new `/dashboard/devices` route, showing a live connected-count badge read from localStorage.
- **New route `_authenticated/dashboard.devices.tsx`** with 3 tabs (shadcn `Tabs`), nothing auto-enabled:
  - **Phone Sensors** — GPS, Motion/Accelerometer, Microphone, Camera, Notifications. Each row has an Enable toggle that requests the *real* permission on tap (`navigator.geolocation`, `DeviceMotionEvent.requestPermission`, `getUserMedia` audio/video, `Notification.requestPermission`) and persists granted/denied status in localStorage. Denied → clear inline fallback text.
  - **Android Health Connect** — clearly-labelled best-effort: "Install the free Nirogi Sync companion app (coming soon)" with the data-type list (steps, heart rate, sleep, weight, SpO2). No fake "connected" state.
  - **Google Fit** — a "Connect (setup required)" flow scaffolded (OAuth implicit-flow button + REST fetch stubs) that stays disabled with a note until a Google client ID is provided. No secrets requested now.
- Connection status stored under `nirogi_devices` and surfaced as status pills on each row and on the dashboard card.

## Priority 2 — Remaining health tools/modules

Two delivery styles, both opening as their own pages and styled like the current tool pages.

**A. Questionnaire / manual AI tools** — added to `src/lib/tools.tsx` (`TOOLS` array) with a matching `buildToolPrompt` case in `health-tools.server.ts`, so they immediately run through the existing `ToolRunner` at `/tools/$tool`, get history + downloadable reports, disclaimers and red-flag dialogs for free:
- **StressSense** — mental-health & stress questionnaire (PSS-style: sleep, mood, workload, anxiety), returns stress level, drivers, coping plan, links to `/breathe`.
- **GlucoTrack** — manual glucose reading (fasting/post-meal mg/dL) + symptoms → interpretation vs thresholds, trend advice, ties into SugarSense.
- **ThermoCheck** — body temperature + symptoms → fever severity, hydration/med guidance, red-flag escalation.
- **BoneHealth** — bone & joint questionnaire (pain, stiffness, calcium/vit-D, activity, age/gender) → osteoporosis/arthritis risk, exercises, tests + INR costs.
- **BioAge** — biological age index computed from saved profile + lifestyle inputs → bio-age vs chronological, top ageing accelerators, 3 weekly actions (uses `preventionScore` meter).

**B. Sensor / live-measurement modules** — dedicated pages that reuse the tool-page shell (header hero + how-it-works + result panel via `ToolRunner`'s result renderer or a shared result card), measure on-device, then call `runTool` with the measured value as fields for the AI insight:
- **OxySense (SpO2/oxygen)** — camera-lens PPG (same getUserMedia + red-channel sampling as `heart-rhythm.tsx`) estimating SpO2 %; clearly "not a medical pulse-oximeter"; AI note + logged.
- **HearWell (hearing health)** — Web Audio tone-sweep / dB self-test with left/right playback and a "can you hear this?" response grid → hearing screen + 60-60 rule; ENT referral flagging.
- **EyeStrain (screen eye strain)** — screen-time via Page Visibility + a 20-20-20 timer and symptom check → strain score, break plan.
- **UVGuard (UV & skin exposure)** — geolocation + Open-Meteo UV API (public, no key) → current UV index, safe-exposure minutes by skin type, sunscreen advice.

All new module pages: back arrow to dashboard, a 7-day Recharts trend from localStorage history, "Log manually", a "Data source" footer line, the AI insight box, empty state when no data (no mock numbers), and `ClinicalDisclaimer`.

**Dashboard wiring:** extend the dashboard hub grid so every new tool/module has a card (icon in its accent colour) opening its page. Questionnaire tools also appear automatically in the existing "Jump into a tool" list since they're in `TOOLS`.

## Priority 3 — Family invite acceptance page

- **New public route `src/routes/invite.$token.tsx`** (top-level, SSR-safe, no auth gate). Loader-free; calls `getInviteInfo` client-side to show the inviter name, the member label/relation, and invite status (pending/accepted/revoked/invalid) with tailored messaging.
- If signed out: "Continue with Google" via `lovable.auth.signInWithOAuth` with `redirect_uri = ${origin}/invite/${token}` (public route, safe), token also stashed in `sessionStorage` as backup.
- On return with a session (via `useAuth`): auto-call `acceptFamilyInvite({ token })`, handle `INVALID_INVITE / REVOKED / SELF_INVITE / ALREADY_USED`, then success state → button to `/dashboard`. Each member logs in with their own Google account and sees only their own data (existing backend already links `member_user_id`).
- **FamilySection:** add a "Generate invite link" action (dialog collecting name + relation → `createFamilyInvite`, copy-to-clipboard link), list existing invites with status via `listFamilyInvites`, and a revoke button via `revokeFamilyInvite`.

## Priority 4 — Voice-guided SenseCheck page

- **New route `_authenticated/sense-check.tsx`** — a guided, accessible flow for the existing `sensecheck` prompt: step-through vision then hearing prompts, each with a mic "Speak your answer" button (Web Speech API, same pattern as `ToolRunner.startVoice`) and a typed fallback. Optional TTS read-out of each question using the browser `speechSynthesis` (with the existing `voice.functions` as server fallback).
- Submits combined answers through `runTool({ tool: "sensecheck" })`, renders the result with the shared result card including warnings/urgent red-flag dialog, specialist and `ReportActions`.
- Dashboard hub + the SenseCheck tool card link here (the generic `/tools/sensecheck` remains as a fallback).

## Technical notes

- New auth-gated pages live under `src/routes/_authenticated/` using dot-convention filenames (`dashboard.devices.tsx` → `/dashboard/devices`); the invite page is the only public one.
- Sensor code: one camera/`AudioContext` stream per active use, strict cleanup on unmount, permission-denied fallbacks everywhere.
- AI insight for sensor modules and all questionnaire tools flows through the existing `runTool` + `buildToolPrompt` (no client API key; Hindi honoured via `lang`).
- Reuse `ReportActions`, `ClinicalDisclaimer`, i18n `t()`, Recharts and shadcn primitives throughout for consistent UI/UX.

## Verification

- Typecheck/build clean; `routeTree.gen` regenerates from new files.
- Playwright smoke: each new tool page renders with empty-state (no mock numbers); device toggles request real permissions; invite page resolves a token and shows accept/sign-in states; a questionnaire tool (e.g. StressSense) returns an AI result; SenseCheck voice page submits and shows warnings.
