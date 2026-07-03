# Nirogi — Complete Wiring + PWA + Dashboard Hub

Two goals: (1) finish and expose every backend feature that is already built but has no UI, and (2) turn Nirogi into an installable mobile-style PWA with a full personal-health dashboard hub of sensor-driven modules and a Connected Devices page. Scope confirmed: **all modules, functional depth**; **phone sensors real, Health Connect / Google Fit as clearly-labelled best-effort UI**.

## Current state (what already exists)

- **Backend built, no UI yet:** `goals.functions` (weight/BMI/calorie targets), `diet.functions` (7-day plan generate + upload + compliance), `family-invite.functions` (invite links + accept), `voice.functions` (TTS/STT), `wellness.functions` breathing + heart-rate logging, `health-score.functions` (already 4-pillar).
- **Pages that exist:** dashboard, water-tracker, exercise-tracker, sleep-tracker, tools/$tool, history, auth, home + legal pages.
- **Missing:** every new page/route for the built backend, all PWA plumbing, and all new spec modules.

## Phase 1 — Expose the already-built features (Priority 1)

New routes + dashboard cards so each backend feature is usable:

- `/goals` — Health Goals: goal type, current/target weight, timeline; AI daily calorie target; weekly weigh-in logging with a Recharts progress-vs-target chart and BMI. Wired to `goals.functions`.
- `/diet-plan` — Diet Plan: questionnaire → AI 7-day plan with tick-off compliance; upload doctor/trainer plan (image/PDF) → AI extract → activate. Today's meals surface on dashboard. Wired to `diet.functions`.
- `/breathe` — BreatheEasy: animated guided breathing (Box, 4-7-8, Calm) with pacing + session logging via `logBreathing`.
- `/heart-rhythm` — HeartRhythm: camera finger-on-lens PPG over ~30s, live pulse waveform, BPM logged via `logHeartRate`, AI rhythm note ("not a medical ECG").
- `/sense-check` — voice-guided vision + hearing test using `voice.functions` TTS/STT, typed fallback, red-flag dialog.
- `/invite/$token` — public invite-accept: shows inviter, Google sign-in, links the new auth user to the family record after session hydration (`getInviteInfo` / `acceptFamilyInvite`). Family card gets a "Generate invite link" action.
- Dashboard: add cards for Goals, Diet, Breathe, HeartRhythm, SenseCheck; extend `FamilySection` with invite generation + joined-status.
- Register all new tools in `src/lib/tools.tsx` where they belong in the grid; keep the compact disclaimer + danger-triangle dialog style.

## Phase 2 — PWA / installable app (Priority 2)

Per the PWA skill (offline requested → guarded `vite-plugin-pwa`, `generateSW`):

- `public/manifest.webmanifest` (name Nirogi AI, standalone, theme `#00E5C3`, bg `#060B18`, portrait) + generated `icon-192`/`icon-512` (maskable) and an apple-touch-icon.
- Head tags for manifest + theme-color + apple-touch-icon in `__root.tsx`.
- `vite-plugin-pwa` with `registerType: autoUpdate`, `devOptions.enabled=false`, `injectRegister: null`; a single guarded registration wrapper that refuses to register in dev / iframe / Lovable preview hostnames / `?sw=off`, unregisters stale workers there, uses NetworkFirst for navigations, CacheFirst for hashed assets, and excludes `/~oauth`.
- **Install prompt UI:** an in-app install banner/toast that listens for `beforeinstallprompt` (Android/Chrome) and shows iOS "Add to Home Screen" instructions on iOS Safari. Dismissible, remembered in localStorage. Offline works only in the published app (noted to user).

## Phase 3 — Dashboard hub + all modules (Priority 1 + 2)

Restyle the dashboard into a mobile-app-style hub grid. Every module page follows the spec's shared template: back arrow to dashboard, 7-day Recharts trend, "Log manually", a "Data Source" footer, and a Lovable-AI insight box; **no mock data** — empty state when none. New/rebuilt module routes under `/dashboard/*`:

```text
sleep  fitness  water  heart-rate  stress  weight  glucose
spo2   temperature  bone-health  hearing-health  eye-strain
bio-age  uv-exposure  altitude  menstrual  energy  devices
```

- Existing water/sleep/exercise get `/dashboard/*` entries (reuse current logic; old routes redirect).
- **Real phone sensors:** heart-rate + spo2 (camera PPG via getUserMedia + canvas red-channel), fitness (DeviceMotion steps + geolocation route), hearing-health (Web Audio dB meter), altitude (Generic Sensor barometer + GPS fallback), uv-exposure (GPS + Open-Meteo UV API), eye-strain (Page Visibility screen-time + optional blink cam), stress (mood check-in + 4-7-8 breathing).
- **Manual + computed:** weight/BMI (+goal, links to Goals), glucose (mg/dL thresholds + SugarSense inline), temperature, bone-health, menstrual (gated by profile gender), bio-age (weighted model over available inputs), energy (composite over sleep/steps/hydration/nutrition).
- **Storage:** new modules use per-key localStorage as the spec specifies (`nirogi_sleep_logs`, `nirogi_fitness_logs`, …); AI insight sentences via a `createServerFn` calling Lovable AI. No new DB tables required for these modules.

## Phase 4 — Connected Devices page (`/dashboard/devices`)

Three tabs, nothing auto-enabled:

- **Phone Sensors:** GPS, Accelerometer, Microphone, Rear/Front Camera, Barometer, Notifications — each with an Enable toggle that requests the real permission on tap and persists status; feeds the modules above. A dashboard **Integrations card** links here.
- **Android Health Connect:** clearly-labelled "install the free Nirogi Sync app (coming soon)" best-effort path with the data-type list — no fake connection.
- **Google Fit:** connect flow scaffolded (OAuth implicit flow + REST fetch stubs) but disabled/best-effort until a Google OAuth client ID is provided; shown as "Connect (setup required)".

## Technical notes

- New pages are TanStack routes under `src/routes/_authenticated/` (auth-gated) except `/invite/$token` (public). File names use dot convention, e.g. `_authenticated/dashboard.heart-rate.tsx` → `/dashboard/heart-rate`.
- Reuse `ReportActions`, `ClinicalDisclaimer`, i18n `t()`, Recharts, and the teal/emerald Sora/Manrope style throughout for consistency.
- AI insights use the existing Lovable AI Gateway pattern via server functions (no key in client), Hindi honoured through the `lang` passthrough.
- One dashboard `AudioContext`/camera stream per active use; strict cleanup on unmount; permission-denied fallbacks everywhere.

## Verification

- Typecheck/build clean.
- Playwright smoke test: install banner appears; each new page renders with empty-state (no mock numbers); camera/mic permission fallbacks; invite-accept flow; diet-plan generate; goals weigh-in; devices toggles request permissions.
