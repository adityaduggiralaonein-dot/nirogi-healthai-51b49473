import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flower2, Loader2, Plus, CalendarHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { toast } from "sonner";
import { ModuleLayout, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { appendEntry, loadEntries, type ModuleEntry } from "@/lib/local-health";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/menstrual")({
  head: () => ({ meta: [{ title: "Menstrual Health · Nirogi" }] }),
  component: MenstrualPage,
});

const MODULE = "menstrual"; // each entry: t = period start, value = duration days, note = "flow|symptoms"
const FLOWS = ["Light", "Medium", "Heavy"];
const SYMPTOM_LIST = ["Cramps", "Bloating", "Mood swings", "Cravings", "Headache", "Fatigue", "Back pain", "Tender breasts"];

const disclaimer = moduleDisclaimer({
  name: "CycleCare",
  disclaimer:
    "CycleCare tracks the cycle data you log and gives general educational guidance. Predictions are estimates and not contraception. For irregular cycles, severe pain or heavy bleeding, see a gynaecologist.",
  redFlags: [
    "Very heavy bleeding (soaking a pad every hour) or large clots",
    "Bleeding between periods or after intercourse",
    "Cycles shorter than 21 or longer than 45 days, or severe disabling pain",
  ],
  emergency:
    "Heavy bleeding with dizziness, fainting or severe abdominal pain needs urgent care — call 112 / 108.",
});

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function MenstrualPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState("");
  const [flow, setFlow] = useState(FLOWS[1]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  const starts = useMemo(
    () => [...entries].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()),
    [entries],
  );

  const cycleLengths = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < starts.length; i++) out.push(daysBetween(starts[i - 1].t, starts[i].t));
    return out.filter((d) => d >= 15 && d <= 60);
  }, [starts]);

  const avgCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28;

  const prediction = useMemo(() => {
    if (!starts.length) return null;
    const lastStart = new Date(starts[starts.length - 1].t);
    const next = new Date(lastStart.getTime() + avgCycle * 86400000);
    const ovulation = new Date(next.getTime() - 14 * 86400000);
    const fertileStart = new Date(ovulation.getTime() - 5 * 86400000);
    const fertileEnd = new Date(ovulation.getTime() + 1 * 86400000);
    return { next, ovulation, fertileStart, fertileEnd };
  }, [starts, avgCycle]);

  const toggle = (s: string) => setSymptoms((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const save = async () => {
    if (!start) { toast.error("Pick the day your period started."); return; }
    const dur = parseInt(duration) || 5;
    const note = `${flow}${symptoms.length ? " · " + symptoms.join(", ") : ""}`;
    const next = appendEntry(MODULE, { value: dur, note, source: "manual", t: new Date(start).toISOString() });
    setEntries(next);
    setStart(""); setDuration(""); setSymptoms([]);
    toast.success("Period logged.");
    setLoadingAi(true);
    try {
      const res = await run({
        data: {
          tool: "menstrual",
          fields: {
            avg_cycle_days: `${avgCycle}`,
            last_period_duration: `${dur} days`,
            flow, symptoms: symptoms.length ? symptoms.join(", ") : "none logged",
            predicted_next_period: prediction ? prediction.next.toLocaleDateString("en-IN") : "needs more data",
            logged_cycles: `${starts.length + 1}`,
          },
          image: null, file: null, fileName: null, lang, memberId,
        },
      });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <ModuleLayout icon={Flower2} accent="pulse" title="Menstrual Health" subtitle="Track your cycle, symptoms and predictions" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
          <p className="flex items-center gap-1.5 text-sm opacity-90"><CalendarHeart className="size-4" /> Predictions</p>
          {prediction ? (
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Next period" value={fmt(prediction.next)} />
              <Row label="Fertile window" value={`${fmt(prediction.fertileStart)} – ${fmt(prediction.fertileEnd)}`} />
              <Row label="Ovulation (est.)" value={fmt(prediction.ovulation)} />
              <Row label="Avg cycle length" value={`${avgCycle} days`} />
            </div>
          ) : (
            <p className="mt-3 text-sm opacity-90">Log your period start to see predictions. Two or more cycles make them accurate.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Log a period</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start date</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (days)</label>
              <Input type="number" min={1} max={14} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 5" />
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Flow</p>
          <div className="mt-1.5 flex gap-2">
            {FLOWS.map((f) => (
              <button key={f} onClick={() => setFlow(f)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", flow === f ? "border-pulse bg-pulse/10 text-pulse" : "border-border text-muted-foreground hover:bg-muted")}>{f}</button>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Symptoms</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SYMPTOM_LIST.map((s) => (
              <button key={s} onClick={() => toggle(s)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", symptoms.includes(s) ? "border-pulse bg-pulse/15 text-pulse" : "border-border hover:bg-muted")}>{s}</button>
            ))}
          </div>
          <Button onClick={save} disabled={loadingAi} className="mt-5 w-full">
            {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Log period
          </Button>
        </section>
      </div>

      {starts.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Cycle history</h2>
          <div className="mt-3 space-y-2">
            {[...starts].reverse().map((e, i) => (
              <div key={e.t + i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{new Date(e.t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-muted-foreground">{e.value} days · {e.note}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3" /> Data source: Your logged cycles (stored on this device)
          </p>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No data yet. Log your period start above to begin tracking.
        </p>
      )}

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Reading your cycle pattern…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="CycleCare" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-90">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
