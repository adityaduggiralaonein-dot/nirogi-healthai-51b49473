import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Hourglass, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/lib/profile.functions";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { moduleSummary, recentAverage } from "@/lib/local-health";

export const Route = createFileRoute("/_authenticated/dashboard/bio-age")({
  head: () => ({ meta: [{ title: "Biological Age Index · Nirogi" }] }),
  component: BioAgePage,
});

const disclaimer = moduleDisclaimer({
  name: "BioAge",
  disclaimer:
    "Biological Age here is a rough lifestyle estimate from your profile and tracked data — not a lab biomarker test. Use it as motivation, not a medical result.",
  redFlags: ["Sudden severe fatigue or breathlessness", "Rapid unexplained physical decline"],
  emergency: "For any sudden, severe symptom, call 112 / 108.",
});

/** Rough biological-age offset from tracked lifestyle signals. */
function computeOffset(s: ReturnType<typeof moduleSummary>) {
  let offset = 0;
  const factors: { label: string; delta: number }[] = [];
  const sleep = s.sleepAvg;
  if (sleep != null) {
    const d = sleep >= 7 && sleep <= 9 ? -1.5 : sleep < 6 ? 2.5 : 1;
    offset += d; factors.push({ label: `Sleep ${sleep}h`, delta: d });
  }
  const steps = s.stepsToday;
  if (steps != null) {
    const d = steps >= 8000 ? -2 : steps >= 5000 ? -0.5 : 1.5;
    offset += d; factors.push({ label: `Steps ${steps}`, delta: d });
  }
  const spo2 = s.spo2;
  if (spo2 != null) {
    const d = spo2 >= 96 ? -0.5 : 1.5;
    offset += d; factors.push({ label: `SpO2 ${spo2}%`, delta: d });
  }
  const stress = recentAverage("mood", 7);
  if (stress != null) {
    const d = stress >= 4 ? -1 : stress <= 2 ? 2 : 0.5;
    offset += d; factors.push({ label: `Mood ${stress}/5`, delta: d });
  }
  const glucose = s.glucose;
  if (glucose != null) {
    const d = glucose <= 99 ? -1 : glucose <= 125 ? 1 : 3;
    offset += d; factors.push({ label: `Glucose ${glucose}`, delta: d });
  }
  return { offset: Math.round(offset), factors: factors.sort((a, b) => b.delta - a.delta) };
}

function BioAgePage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const getProfile = useServerFn(getMyProfile);
  const run = useServerFn(runTool);
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => getProfile() });

  const [summary, setSummary] = useState<ReturnType<typeof moduleSummary> | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setSummary(moduleSummary()), []);

  const age = data?.profile?.age ?? null;
  const calc = useMemo(() => (summary ? computeOffset(summary) : null), [summary]);
  const bioAge = age != null && calc ? Math.max(18, age + calc.offset) : null;

  const analyze = async () => {
    if (!summary) return;
    setLoadingAi(true);
    try {
      const fields: Record<string, string> = {
        chronological_age: age != null ? `${age}` : "unknown (ask user to add to profile)",
        estimated_offset_years: calc ? `${calc.offset}` : "0",
        sleep_avg_hrs: summary.sleepAvg != null ? `${summary.sleepAvg}` : "no data",
        steps_latest: summary.stepsToday != null ? `${summary.stepsToday}` : "no data",
        glucose_latest: summary.glucose != null ? `${summary.glucose}` : "no data",
        spo2_latest: summary.spo2 != null ? `${summary.spo2}` : "no data",
        mood_avg: recentAverage("mood", 7) != null ? `${recentAverage("mood", 7)}/5` : "no data",
      };
      const res = await run({ data: { tool: "bioage", fields, image: null, file: null, fileName: null, lang, memberId } });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <ModuleLayout icon={Hourglass} accent="primary" title="Biological Age Index" subtitle="How old your body acts, from your lifestyle & tracked data" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
          <p className="text-sm opacity-90">Estimated biological age</p>
          <div className="font-display text-6xl font-extrabold">{bioAge ?? "—"}</div>
          {age != null && bioAge != null ? (
            <p className="mt-1 text-sm opacity-90">
              {bioAge < age ? `${age - bioAge} years younger` : bioAge > age ? `${bioAge - age} years older` : "same as"} than your age ({age})
            </p>
          ) : (
            <p className="mt-1 text-sm opacity-90">Add your age in the profile to compute this</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">What's affecting it</h2>
          {calc && calc.factors.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {calc.factors.map((f) => (
                <li key={f.label} className="flex items-center justify-between text-sm">
                  <span>{f.label}</span>
                  <span className={f.delta < 0 ? "font-semibold text-success" : "font-semibold text-warning"}>
                    {f.delta < 0 ? "" : "+"}{f.delta} yr
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Log sleep, steps, glucose, SpO2 and mood in their modules — this index gets sharper with more data.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">AI longevity insight</h2>
            <p className="text-sm text-muted-foreground">A personalised read on what to improve first.</p>
          </div>
          <Button onClick={analyze} disabled={loadingAi}>
            {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyze
          </Button>
        </div>
        {loadingAi ? (
          <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-sm">Reading your profile and tracked data…</p>
          </div>
        ) : result ? (
          <div className="mt-5"><AiResultPanel result={result} toolName="BioAge" /></div>
        ) : null}
      </section>
    </ModuleLayout>
  );
}
