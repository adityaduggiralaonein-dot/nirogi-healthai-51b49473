import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Zap, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { moduleSummary, recentAverage } from "@/lib/local-health";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/energy")({
  head: () => ({ meta: [{ title: "Energy & Recovery · Nirogi" }] }),
  component: EnergyPage,
});

const disclaimer = moduleDisclaimer({
  name: "Energy & Recovery",
  disclaimer:
    "The energy score blends your tracked sleep, mood, activity, hydration and nutrition into a rough daily readiness indicator. It is guidance, not a medical measurement.",
  redFlags: ["Persistent exhaustion despite rest", "Fatigue with breathlessness or chest pain"],
  emergency: "Fatigue with chest pain or breathlessness needs urgent care — call 112 / 108.",
});

type Factor = { key: string; label: string; weight: number; sub: number | null };

function computeEnergy(): { score: number | null; factors: Factor[] } {
  const s = moduleSummary();
  const sleep = s.sleepAvg;
  const mood = recentAverage("mood", 3);
  const steps = s.stepsToday;
  const water = s.waterToday;

  const factors: Factor[] = [
    { key: "sleep", label: "Sleep quality", weight: 30, sub: sleep != null ? clamp((sleep / 8) * 100) : null },
    { key: "stress", label: "Mood / stress", weight: 25, sub: mood != null ? clamp((mood / 5) * 100) : null },
    { key: "steps", label: "Activity", weight: 20, sub: steps != null ? clamp((steps / 8000) * 100) : null },
    { key: "water", label: "Hydration", weight: 15, sub: water != null ? clamp((water / 3000) * 100) : null },
    { key: "nutrition", label: "Nutrition", weight: 10, sub: null },
  ];

  const known = factors.filter((f) => f.sub != null);
  if (known.length === 0) return { score: null, factors };
  const totalWeight = known.reduce((a, f) => a + f.weight, 0);
  const score = Math.round(known.reduce((a, f) => a + (f.sub as number) * f.weight, 0) / totalWeight);
  return { score, factors };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tier(score: number) {
  if (score >= 80) return { emoji: "⚡", label: "Peak" };
  if (score >= 60) return { emoji: "🟢", label: "Good" };
  if (score >= 40) return { emoji: "🟡", label: "Low" };
  return { emoji: "🔋", label: "Drained" };
}

function EnergyPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [data, setData] = useState<{ score: number | null; factors: Factor[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setData(computeEnergy()), []);

  const t = useMemo(() => (data?.score != null ? tier(data.score) : null), [data]);

  const analyze = async () => {
    if (!data || data.score == null) return;
    setLoadingAi(true);
    try {
      const fields: Record<string, string> = { energy_score: `${data.score}/100` };
      for (const f of data.factors) fields[f.key] = f.sub != null ? `${f.sub}/100` : "no data";
      const res = await run({ data: { tool: "energyscore", fields, image: null, file: null, fileName: null, lang, memberId } });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <ModuleLayout icon={Zap} accent="warning" title="Energy & Recovery" subtitle="A composite daily readiness score from your tracked data" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
          <p className="text-sm opacity-90">Today's energy score</p>
          <div className="font-display text-6xl font-extrabold">{data?.score ?? "—"}</div>
          {t ? <p className="mt-1 text-lg font-semibold">{t.emoji} {t.label}</p> : <p className="mt-1 text-sm opacity-90">Log sleep, mood, steps & water to compute</p>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Contributing factors</h2>
          <div className="mt-3 space-y-3">
            {data?.factors.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between text-sm">
                  <span>{f.label} <span className="text-muted-foreground">({f.weight}%)</span></span>
                  <span className="text-muted-foreground">{f.sub != null ? `${f.sub}/100` : "no data"}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className={cn("h-full rounded-full", f.sub != null ? "bg-gradient-primary" : "bg-muted")} style={{ width: `${f.sub ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {data?.score == null && (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No data yet. Log your sleep, mood, steps and water in their modules to see your energy score.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">AI recovery insight</h2>
            <p className="text-sm text-muted-foreground">What to do today to feel your best.</p>
          </div>
          <Button onClick={analyze} disabled={loadingAi || data?.score == null}>
            {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyze
          </Button>
        </div>
        {loadingAi ? (
          <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-sm">Combining your modules…</p>
          </div>
        ) : result ? (
          <div className="mt-5"><AiResultPanel result={result} toolName="Energy & Recovery" /></div>
        ) : null}
      </section>
    </ModuleLayout>
  );
}
