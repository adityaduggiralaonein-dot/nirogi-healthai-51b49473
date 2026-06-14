# Nirogi AI — Build Plan

A premium, AI-powered preventive-health platform with six functional AI tools, secure Google login, a personal health dashboard, and a polished marketing homepage. Built for the Redrob × Hack2skill hackathon.

## Design Direction
- **Aesthetic:** trustworthy medical-tech — deep clinical teal/emerald + a vital "pulse red" accent, on near-white with soft depth (layered shadows, subtle gradients, glassy cards). Distinctive type pairing (a strong display face + clean body face), not Inter/Poppins.
- **Hero:** animated ECG heart-pulse line tracing across the screen with a catchy life-saving tagline above it ("Catch it before it's too late"), plus primary CTAs.
- Motion via framer-motion (scroll reveals, one hero centerpiece animation). Fully responsive, light/dark aware. All colors as semantic tokens in `src/styles.css`.

## Homepage (rich, multi-section)
1. Hero — pulse animation + tagline + CTA
2. Trust strip / impact stats ("Built for Bharat", 24/7, voice + camera)
3. **Six AI tools** feature grid — each card links to its own page
4. How it works (3 steps: profile → choose tool → AI insight)
5. **Latest updates** section (changelog/news cards)
6. **Data sources** section — WHO, Harvard research, CDSCO, peer-reviewed studies, with logos/citations
7. **FAQs** (accordion)
8. Mission band ("doesn't wait for you to fall sick…")
9. Footer — Redrob + Hack2skill logos, legal links, Cookie Settings trigger

## Six AI tool pages (one route each, fully functional)
Each page: purpose, "how it works", live tool UI, results display, and the exact **disclaimer/warning** from the document. Every tool reads the user's health profile before generating output.
1. **MedGuard** — medicine + dosage + duration → 3-level (short/medium/long) side-effect report, dangerous-combination flags, safer alternatives, specialist suggestion.
2. **CancerSense** — lifestyle questionnaire → personalized cancer-risk report (type / risk % / reason), recommended tests + specialist.
3. **SenseCheck** — voice-first vision & hearing diagnostic (speech in/out via browser Web Speech API) → condition report, downloadable PDF.
4. **CalorieEye** — meal photo → nutrient breakdown vs daily limits; saves to a weekly food diary; weekly disease-risk report.
5. **SkinScan** — skin photo → condition + severity (incl. URGENT skin-cancer flag), home-care vs specialist guidance, history tracking.
6. **MedVerify** — batch number entry → medicine authenticity/expiry/recall verification (AI-simulated CDSCO-style lookup with clear "verify with pharmacist" warning).

AI is powered by Lovable AI (Gemini, multimodal for photos) via secure server functions — keys never exposed to the browser. Each tool returns structured output rendered in clean result cards.

## Auth & Profile Dashboard
- **Google sign-in** via the Lovable broker, saved to Lovable Cloud. Auth-gated dashboard routes.
- **Profile dashboard:** weight, height, **BMI auto-calculated**, health issues/conditions, current medicines, family history, recent surgeries.
- **Prescription upload** → stored privately per-user; AI reads and explains it deeply.
- Per-user data isolation (RLS): each user only ever sees their own health data; prescriptions in a private storage bucket.

## Cookies & Legal
- Cookie consent banner: **Accept all** / **Essential only** / customize.
- Footer **Cookie Settings** link reopens the banner.
- Legal pages: Terms of Service, Privacy Policy, Cookie Policy.

## Footer Branding
- Redrob and Hack2skill logos (sourced official where possible; clean styled wordmark fallback), "Made for India Runs by Redrob AI — Track 2 / Hack2skill".

---

## Technical Notes
- **Stack:** TanStack Start + Tailwind v4 tokens + shadcn/ui + framer-motion.
- **Backend:** Lovable Cloud (Supabase). Tables: `profiles` (health data, RLS to `auth.uid()`), `food_diary` (CalorieEye weekly tracking), `scan_history` (SkinScan/tool history), `updates` (latest-updates content). Private `prescriptions` storage bucket with per-user policies. All tables get explicit GRANTs + RLS.
- **AI:** `createServerFn` handlers calling Lovable AI Gateway (`google/gemini-3-flash-preview`, multimodal for image tools), structured output, with 429/402 error handling surfaced in the UI.
- **Routes:** `/`, `/tools/medguard`, `/tools/cancersense`, `/tools/sensecheck`, `/tools/calorieeye`, `/tools/skinscan`, `/tools/medverify`, `/auth`, `/_authenticated/dashboard`, `/terms`, `/privacy`, `/cookies`. Each route gets its own SEO `head()` metadata.
- **Disclaimers:** every tool shows its document-specified medical disclaimer prominently.

## Build Order
1. Enable Lovable Cloud + Google auth + AI key; create DB schema, storage, RLS.
2. Design tokens + shared layout (header/footer) + homepage sections.
3. Auth flow + profile dashboard + prescription upload/AI read.
4. Six tool pages with live AI server functions.
5. Cookie consent system + legal pages.
6. Latest-updates + data-sources content, logos, SEO, QA across viewports.
