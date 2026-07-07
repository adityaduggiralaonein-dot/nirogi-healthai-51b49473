# Complete & fix the dashboard module pages

## What I found (important)

Most of the pages you listed **are already built and wired up** — they open as their own pages with a back arrow, a 7‑day Recharts trend, a "Data source" line, manual logging, and an AI insight box:

- Built & registered: `stress`, `glucose`, `temperature`, `bone-health`, `bio-age`, `energy`, `weight`, `oxygen` (SpO2, with real camera PPG), `uv` (real GPS + Open‑Meteo), `hearing`, `eye-strain`, `devices`, plus `sense-check`.

So why do they look "not built" to you: **you're stuck on `/auth`.** Every module lives under the `_authenticated` guard, so if sign‑in doesn't complete, each page just bounces back to `/auth` and looks empty. There's also a **hydration crash on the `/auth` page itself** that can break the sign‑in screen. That's the real blocker — not missing pages.

There are also genuine gaps vs. the Word doc, which I'll close.

## Plan

### 1. Fix the access blocker (do this first)

- Fix the `/auth` hydration mismatch (server renders a Suspense boundary, client renders the page) by rendering the auth screen client‑only (`ssr: false` on the `/auth` route). This restores a working sign‑in screen.
- After that, sign in and click through every module card to confirm each page loads (verify with a browser pass), fixing any page that errors.

### 2. Align routes to the doc's paths

The doc specifies exact routes. I'll make these resolve (add the spec path as the canonical route, keep the old one redirecting so nothing breaks):

- `/dashboard/oxygen` → `**/dashboard/spo2**`
- `/dashboard/uv` → `**/dashboard/uv-exposure**`
- `/dashboard/hearing` → `**/dashboard/hearing-health**`
- Add dashboard entries/links for the existing trackers so they're reachable from the hub at the doc paths: Sleep (`/dashboard/sleep`), Fitness (`/dashboard/fitness`), Water (`/dashboard/water`), Heart Rate (`/dashboard/heart-rate`) — these exist today as top‑level routes (`/sleep-tracker`, etc.); I'll expose them under `/dashboard/*` per the spec.

### 3. Build the two pages that are actually missing

- `**/dashboard/altitude**` — barometric pressure via Generic Sensor API with GPS‑altitude fallback, altitude‑sickness alert >2500m, 7‑day history, manual log, data source, AI insight.
- `**/dashboard/menstrual**` — only shown for users who select Female / Prefer‑not‑to‑say or opt in; cycle start, duration, flow, symptoms, predicted next period & fertile window, cycle‑length trend, AI insight.

### 4. Deepen the pages you named to full Section‑3 spec

Bring these up to exactly what the doc describes (keeping the shared ModuleLayout / TrendCard / AiResultPanel / disclaimer pattern):

- **Stress & Mental Health** — add the built‑in 4‑7‑8 breathing guide inline, 7‑day mood calendar with colour coding, Page‑Visibility screen‑time proxy (already has mood check‑in + journal + AI).
- **Blood Glucose** — colour‑code readings by fasting (<100 / 100‑125 / >126) and post‑meal (<140) thresholds, fasting‑vs‑post‑meal pattern, estimated HbA1c from average, 14‑day trend.
- **Weight & BMI** — BMI ring with category colour, target‑weight goal + progress bar + estimated date, 30‑day trend, body‑composition slots if provided.
- **Blood Oxygen (SpO2)** — keep camera PPG; add colour bands (95‑100 green / 90‑94 yellow / <90 red) and altitude note.
- **Eye Strain** — Page‑Visibility screen‑time estimate + 20‑20‑20 reminder toggle + tips + link to SenseCheck vision test.
- **Energy & Recovery** — 14‑day trend + recommended activity level + recovery advice (already computes the composite score).
- **Bio‑Age**, **UV**, **Hearing**, **Bone & Joint**, **Temperature**, **Energy** — confirm each has back arrow, real data source, 7‑day trend, manual log, AI insight, and the empty‑state message "No data yet…" (no hardcoded fake numbers).

### 5. General spec compliance pass (all module pages)

- Back arrow to `/dashboard` ✓ (already in ModuleLayout)
- "Data source" section ✓
- 7‑day Recharts trend ✓
- "Log manually" ✓
- AI insight from Lovable AI based on recent data ✓
- No mock data; show "No data yet. Enable a data source below or log manually." for empty states.

## Order of work

1. Auth hydration fix (unblocks everything) → verify sign‑in.
2. Route alignment + dashboard hub links.
3. Missing pages: altitude, menstrual.
4. Deepen the named pages to full spec.
5. Browser verification pass over every module page.

## Technical notes

- All sensor/measurement data stays in `localStorage` (per‑module keys via `local-health.ts`); only summarised numbers go to Lovable AI. This matches the doc's localStorage‑key model (`nirogi_sleep_logs`, `nirogi_fitness_logs`, `nirogi_water_logs`, etc.) — I'll standardise the keys to the doc's names where they're referenced.
- Reuse existing `ModuleLayout`, `TrendCard`, `AiResultPanel`, `ClinicalDisclaimer`, and i18n.
- `routeTree.gen.ts` is auto‑generated — I won't hand‑edit it; new/renamed route files regenerate it.

After this, everything under Priorities 1 & 2 opens as its own working page and behaves as the doc's Section 3 requires. Priorities 6 → 5 → 3 follow in the order you specified.

**Note:** since the pages largely exist, most of this is a fix‑and‑complete pass rather than a from‑scratch rebuild — that's faster and avoids throwing away working code. If you'd rather I hard‑rebuild specific pages regardless, tell me which. Also after signning in those pages are not opening and it is getting redirected upwards like auth as you mentioned. so please fix those issues and those pages should load.  Also the image is uploaded for priority 5.