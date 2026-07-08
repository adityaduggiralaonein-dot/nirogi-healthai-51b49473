# Fix navigation + complete priorities 6 → 5 → 3 → 7 → 4 (+8) in one shipment

## The real navigation bug (root cause)

`/dashboard` has child routes (`dashboard.uv`, `dashboard.stress`, `dashboard.glucose`, `dashboard.temperature`, `dashboard.bone-health`, `dashboard.bio-age`, `dashboard.energy`, `dashboard.eye-strain`, `dashboard.hearing`, `dashboard.oxygen`, `dashboard.altitude`, `dashboard.menstrual`, `dashboard.devices`). That makes `dashboard.tsx` a **layout route**, but it renders the full hub with **no `<Outlet />**`. So navigating to `/dashboard/uv` matches the child, but the parent has nowhere to render it — the hub just re-renders, which looks like it "bounces back up."

Fitness/Water/Heart-rate/Sleep "work" only because they `throw redirect` to routes *outside* `/dashboard`, so they leave the layout entirely.

**Fix:** Split the hub out of the layout (standard TanStack pattern):

- Create `src/routes/_authenticated/dashboard.index.tsx` = the current hub UI (moved verbatim).
- Reduce `src/routes/_authenticated/dashboard.tsx` to a layout that renders only `<Outlet />`.

This single change makes every in-place module page open correctly. I'll verify with a Playwright signed-in pass over uv, stress, glucose, energy, eye-strain, oxygen.

## Priority interpretation (from your approved plan numbering)

P6 = AI Doctor Avatars · P5 = PWA logo + intro animation · P3 = Connected Devices · P7 = Family Google sign-in · P4 = Health Score + prescription approval · P8 = delete skin-scan images. If any number means something else, tell me and I'll adjust — otherwise I build in the order 6 → 5 → 3 → 7 → 4, then 8.

## Priority 6 — AI Doctor Avatar Consultation System (first version)

DB tables already exist (`doctor_chats`, `doctor_messages`, `user_credits`, `credit_transactions`). Build the app on top:

- `src/lib/doctors.ts` — the 12 doctor profiles (name, specialty, bio, conditions, connected tools, accent, ElevenLabs voice id, per-doctor system prompt).
- Generate 12 stylized doctor portrait images (`src/assets/doctors/`) for cards and the profile header. 3D: render a Ready Player Me GLB via `@react-three/fiber` + `@react-three/drei` **client-only** on the doctor page, with the portrait as fallback (keeps SSR safe and credits low).
- Dashboard "My Doctors" horizontal swipe row (Framer Motion), added to `dashboard.index.tsx` under the trackers; online dot + rating.
- `src/routes/_authenticated/doctors.$id.tsx` — profile page: avatar, bio, connected tools, credit pill, Start Chat / Voice Call, recent history.
- `src/lib/doctor.functions.ts` + `doctor.server.ts` — `sendDoctorMessage` (Lovable AI Gateway with the doctor's system prompt + injected profile/tool context, persists messages, deducts 2 credits), `startCall`/`speakLine` (ElevenLabs TTS server-side via `ELEVENLABS_API_KEY`, 5 credits/min), `getCredits`, `earnCredits` (50 on profile complete).
- Voice: Web Speech API (STT) client-side; ElevenLabs audio played back; simple mouth/idle animation. Credit pill in the doctor page header; graceful "earn more" modal at 0 credits — never a hard paywall.

## Priority 5 — PWA logo + intro animation

- Use the uploaded logo (`ChatGPT_Image_Jul_7_2026...png`): regenerate `public/icons/nirogi-512.png` (192/512 + maskable) and `apple-touch-icon`; keep manifest metadata.
- Framer Motion launch/splash overlay on first mount (logo heartbeat → fade), shown once per session.
- Apply consistent Framer Motion entrance to dashboard sections (reuse existing `Reveal`).

## Priority 3 — Connected Devices

Bring `dashboard.devices.tsx` to spec: Phone Sensors tab (GPS, Accelerometer, Mic, Camera, Barometer, Notifications — live permission/status, persisted to `nirogi_devices_config`), Android Health Connect tab (best-effort "install Nirogi Sync" guidance + status), Google Fit tab (implicit OAuth via `VITE_GOOGLE_FIT_CLIENT_ID`, best-effort until a client id is provided) — each with clear connection status.

## Priority 7 — Family Google sign-in (remaining 50%)

Invite accept flow (`invite.$token.tsx`) already exists. Complete: in `FamilySection`, "Invite via Google" generates a shareable `/invite/$token` link with copy/share; ensure invited members appear with their profile after accepting; add member switching wired to `useActiveMember` so each family member's profile/data is scoped; revoke/remove controls. Verify token verification + add-to-family end to end.

## Priority 4 — Health Score + prescription approval

- Rework `HealthScoreCard` to the pillar model (Physical / Hydration / Sleep / Personal-OS) from cross-module `local-health` aggregates.
- Prescription approval: after `analyzePrescription`, return a structured medicine list; dashboard shows each medicine with an "Add as reminder" confirm step before writing to `medicine_reminders`; add "Clear prescription" to wipe stored analysis and re-upload.

## Priority 8 — Delete skin-scan images immediately

In the SkinScan path, ensure the uploaded image is used only for the single AI call and never persisted — clear the in-memory data URL right after the result returns, and confirm no storage upload/DB write of the image occurs.

## Notes on scope & credits

- All sensor/measurement data stays in `localStorage`; only summarized numbers go to Lovable AI.
- Reuse `ModuleLayout`, `TrendCard`, `AiResultPanel`, `ClinicalDisclaimer`, `Reveal`, i18n `t()` — no new patterns.
- `routeTree.gen.ts` is auto-generated; I won't hand-edit it.
- P6 is genuinely large (12 doctors, 3D, voice, credits). I'll ship a working first version; deep polish (full viseme lip-sync, streaming duplex audio) can follow. Everything else lands complete in this shipment.

## Order of work

1. Navigation Outlet fix → Playwright verify module pages open.
2. P6 doctors → P5 logo/intro → P3 devices → P7 family → P4 score/prescription → P8 skin images.
3. Final signed-in Playwright smoke pass across new pages. 
  **NOTE ;**
  1. Complete all the work in single shipment and today.
  2.  fix all the bugs and the pages should open in health module
  3.  Remaining work should be completed today itself in this shipment. 
  4.  No work should be left incomplete. 
  5. Try to minimise credits and use it efficiently.