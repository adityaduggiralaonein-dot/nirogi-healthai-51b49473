import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Ear, Loader2, Play, Check, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, TrendCard, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { appendEntry, latestEntry, loadEntries, type ModuleEntry } from "@/lib/local-health";

export const Route = createFileRoute("/_authenticated/dashboard/hearing")({
  head: () => ({ meta: [{ title: "Hearing Health · Nirogi" }] }),
  component: HearingPage,
});

const MODULE = "hearing";
const FREQS = [500, 1000, 2000, 4000, 8000];
const EARS: ("left" | "right")[] = ["left", "right"];

const disclaimer = moduleDisclaimer({
  name: "HearWell",
  disclaimer:
    "HearWell is a rough hearing self-check played through your phone or earphones — it is NOT clinical audiometry. Speaker quality, volume and background noise all affect results. Only a certified audiologist with calibrated equipment can measure your hearing.",
  redFlags: [
    "Sudden hearing loss in one or both ears",
    "Hearing loss with dizziness, ear pain or discharge",
    "Constant ringing (tinnitus) that is new or worsening",
  ],
  emergency:
    "Sudden hearing loss is a medical emergency that is treatable if caught early — see an ENT doctor the same day or call 112.",
});

function HearingPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);
  const ctxRef = useRef<AudioContext | null>(null);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [step, setStep] = useState(0); // index into flattened ear×freq sequence
  const [testing, setTesting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [symptoms, setSymptoms] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);
  useEffect(() => () => { ctxRef.current?.close().catch(() => {}); }, []);

  const sequence = EARS.flatMap((ear) => FREQS.map((f) => ({ ear, f })));
  const current = sequence[step];

  const playTone = async () => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      osc.frequency.value = current.f;
      osc.type = "sine";
      gain.gain.value = 0.06; // deliberately quiet, so only reasonable hearing catches it
      panner.pan.value = current.ear === "left" ? -1 : 1;
      osc.connect(gain).connect(panner).connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); }, 1200);
    } catch {
      toast.error("Couldn't play audio in this browser.");
    }
  };

  const startTest = () => {
    setAnswers({});
    setStep(0);
    setTesting(true);
    setResult(null);
    setTimeout(playTone, 250);
  };

  const answer = (heard: boolean) => {
    const key = `${current.ear}-${current.f}`;
    const next = { ...answers, [key]: heard };
    setAnswers(next);
    if (step + 1 < sequence.length) {
      setStep(step + 1);
      setTimeout(playTone, 350);
    } else {
      finish(next);
    }
  };

  const finish = (final: Record<string, boolean>) => {
    setTesting(false);
    const heardCount = Object.values(final).filter(Boolean).length;
    const score = Math.round((heardCount / sequence.length) * 100);
    setEntries(appendEntry(MODULE, { value: score, source: "tone test" }));
    toast.success(`Hearing screen complete — ${score}% of tones heard.`);
    insight(final, score);
  };

  const insight = async (final: Record<string, boolean>, score: number) => {
    setLoadingAi(true);
    const missed = Object.entries(final).filter(([, v]) => !v).map(([k]) => k.replace("-", " ") + " Hz");
    try {
      const res = await run({
        data: {
          tool: "hearwell",
          fields: {
            tones_heard: `${score}% (${Object.values(final).filter(Boolean).length}/${sequence.length})`,
            tones_missed: missed.length ? missed.join(", ") : "none",
            symptoms: symptoms || "none reported",
          },
          image: null,
          file: null,
          fileName: null,
          lang,
          memberId,
        },
      });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const last = latestEntry(MODULE);

  return (
    <ModuleLayout icon={Ear} accent="success" title="Hearing Health" subtitle="A quick tone-based hearing self-check" disclaimer={disclaimer}>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
        <Volume2 className="mr-1 inline size-4 text-primary" /> Use earphones in a quiet room for the most reliable result. Set your volume to a comfortable medium level and don't change it during the test.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Tone test</h2>
          {!testing ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">You'll hear {sequence.length} quiet tones across both ears. Tap "I heard it" or "Nothing" for each.</p>
              <Button onClick={startTest} className="mt-4 w-full">
                <Play className="size-4" /> Start hearing test
              </Button>
            </>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tone {step + 1} of {sequence.length}</p>
              <div className="mt-2 font-display text-2xl font-bold capitalize">{current.ear} ear · {current.f} Hz</div>
              <Button variant="outline" onClick={playTone} className="mt-4">
                <Play className="size-4" /> Replay tone
              </Button>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button onClick={() => answer(true)} className="bg-success text-success-foreground hover:bg-success/90">
                  <Check className="size-4" /> I heard it
                </Button>
                <Button onClick={() => answer(false)} variant="outline">
                  <X className="size-4" /> Nothing
                </Button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
            <p className="text-sm opacity-90">Last screen</p>
            <div className="font-display text-6xl font-extrabold">{last ? `${last.value}` : "—"}</div>
            <p className="text-sm opacity-90">% of tones heard</p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Symptoms (optional)</h2>
            <Textarea className="mt-3" rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Ringing (tinnitus), muffled sound, trouble in noisy places…" />
          </section>
        </div>
      </div>

      <TrendCard title="7-day trend" entries={entries} unit="%" accent="success" dataSource="In-browser tone test (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Analyzing your hearing screen…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="HearWell" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
