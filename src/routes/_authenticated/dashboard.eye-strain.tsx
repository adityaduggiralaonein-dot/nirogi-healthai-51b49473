import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Loader2, Timer, Play, Square, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, TrendCard, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { appendEntry, latestEntry, loadEntries, type ModuleEntry } from "@/lib/local-health";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/eye-strain")({
  head: () => ({ meta: [{ title: "Screen Eye Strain · Nirogi" }] }),
  component: EyeStrainPage,
});

const MODULE = "eyestrain";
const SYMPTOMS = ["Dry / gritty eyes", "Blurred vision", "Headaches", "Sore / tired eyes", "Neck / shoulder ache", "Light sensitivity"];

const disclaimer = moduleDisclaimer({
  name: "EyeStrain",
  disclaimer:
    "EyeStrain gives general digital-eye-strain guidance based on your screen habits and symptoms. It is not an eye exam and cannot detect eye disease. Persistent blurring, pain or headaches should be checked by an optometrist or ophthalmologist.",
  redFlags: [
    "Sudden vision loss, double vision or a curtain over your sight",
    "Eye pain with redness, nausea or halos around lights",
    "Flashes of light with a shower of new floaters",
  ],
  emergency:
    "Sudden vision loss, severe eye pain or flashes with floaters need urgent eye care — go to an emergency eye clinic or call 112.",
});

function EyeStrainPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [hours, setHours] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  // 20-20-20 break timer
  const [timerOn, setTimerOn] = useState(false);
  const [secs, setSecs] = useState(20 * 60);
  const tickRef = useRef<number | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  useEffect(() => {
    if (!timerOn) return;
    tickRef.current = window.setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          toast.info("20-20-20 break: look at something 20 feet away for 20 seconds 👀");
          return 20 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerOn]);

  const toggle = (s: string) => setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const assess = async () => {
    const h = parseFloat(hours);
    if (!h) { toast.error("Enter your daily screen hours."); return; }
    // Simple strain score 0-100 (higher = more strain).
    const score = Math.min(100, Math.round(h * 7 + selected.length * 8));
    setEntries(appendEntry(MODULE, { value: score, source: "self-report" }));
    setLoadingAi(true);
    try {
      const res = await run({
        data: {
          tool: "eyestrain",
          fields: {
            daily_screen_hours: `${h} hours`,
            symptoms: selected.length ? selected.join(", ") : "none",
            strain_score: `${score}/100`,
          },
          image: null,
          file: null,
          fileName: null,
          lang,
          memberId,
        },
      });
      setResult(res as ToolResult);
      toast.success("Eye-strain assessment ready.");
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const last = latestEntry(MODULE);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <ModuleLayout icon={Eye} accent="warning" title="Screen Eye Strain" subtitle="Track digital eye strain and take healthy breaks" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Daily check-in</h2>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium">Hours on screens today</label>
            <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 8" />
          </div>
          <p className="mt-4 text-sm font-medium">Symptoms you notice</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selected.includes(s) ? "border-warning bg-warning/15 text-warning" : "border-border hover:bg-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Button onClick={assess} disabled={loadingAi} className="mt-5 w-full">
            {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Assess my eye strain
          </Button>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
            <p className="text-sm opacity-90">Last strain score</p>
            <div className="font-display text-6xl font-extrabold">{last ? `${last.value}` : "—"}</div>
            <p className="text-sm opacity-90">/ 100 (lower is better)</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Timer className="size-5 text-warning" /> 20-20-20 timer</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every 20 min, look 20 feet away for 20 seconds.</p>
            <div className="mt-3 text-center font-display text-4xl font-extrabold tabular-nums">{mm}:{ss}</div>
            <Button onClick={() => { setTimerOn((v) => !v); if (timerOn) setSecs(20 * 60); }} variant={timerOn ? "outline" : "default"} className="mt-3 w-full">
              {timerOn ? <><Square className="size-4" /> Stop</> : <><Play className="size-4" /> Start reminders</>}
            </Button>
          </section>
        </div>
      </div>

      <TrendCard title="7-day strain trend" entries={entries} unit="/100" accent="warning" dataSource="Self-reported screen time & symptoms (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Analyzing your screen habits…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="EyeStrain" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
