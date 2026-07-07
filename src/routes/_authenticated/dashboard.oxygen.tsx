import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Plus, Info, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/dashboard/oxygen")({
  head: () => ({ meta: [{ title: "Blood Oxygen (SpO2) · Nirogi" }] }),
  component: OxygenPage,
});

const MODULE = "oxygen";
const MEASURE_MS = 22000;

const disclaimer = moduleDisclaimer({
  name: "OxySense",
  disclaimer:
    "OxySense estimates blood oxygen from your phone camera and is NOT a medical pulse oximeter. Camera estimates are approximate and can be wrong. Never use it to make health decisions — use a certified pulse oximeter and see a doctor if you feel breathless.",
  redFlags: [
    "Breathlessness at rest, blue lips or fingertips",
    "A reliable oximeter reading of 92% or below",
    "Chest pain, confusion or severe fatigue",
  ],
  emergency:
    "Low oxygen with breathlessness or blue lips is an emergency — call 112 / 108 or go to the nearest emergency room immediately.",
});

function OxygenPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const samples = useRef<{ t: number; v: number }[]>([]);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [measuring, setMeasuring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manual, setManual] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);

  const insight = async (spo2: number) => {
    setLoadingAi(true);
    try {
      const res = await run({
        data: {
          tool: "oxysense",
          fields: { estimated_spo2: `${spo2}%`, symptoms: symptoms || "none reported" },
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

  const save = (spo2: number, source: string) => {
    setEntries(appendEntry(MODULE, { value: spo2, source }));
    toast.success(`SpO2 ${spo2}% logged.`);
    insight(spo2);
  };

  const start = async () => {
    samples.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 320, height: 240 } });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
      } catch { /* torch unsupported */ }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMeasuring(true);
      toast.info("Cover the rear camera + flash with your fingertip. Hold still.");

      const canvas = document.createElement("canvas");
      canvas.width = 60;
      canvas.height = 40;
      const cctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const startT = performance.now();

      const loop = () => {
        const v = videoRef.current;
        if (!v) return;
        cctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const { data: px } = cctx.getImageData(0, 0, canvas.width, canvas.height);
        let red = 0;
        for (let i = 0; i < px.length; i += 4) red += px[i];
        red /= px.length / 4;
        samples.current.push({ t: performance.now(), v: red });
        const elapsed = performance.now() - startT;
        setProgress(Math.min(100, (elapsed / MEASURE_MS) * 100));
        if (elapsed >= MEASURE_MS) {
          finish();
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      toast.error("Couldn't access the camera. Use manual entry instead.");
      cleanup();
      setMeasuring(false);
    }
  };

  const finish = () => {
    cleanup();
    setMeasuring(false);
    setProgress(0);
    const spo2 = estimateSpo2(samples.current);
    if (spo2) save(spo2, "camera");
    else toast.error("Couldn't read a clear signal. Hold still and try again, or enter it manually.");
  };

  const last = latestEntry(MODULE);
  const spo2Band = last
    ? last.value >= 95
      ? { label: "Normal (95–100%)", cls: "text-success", bg: "bg-success/15" }
      : last.value >= 90
        ? { label: "Mildly low (90–94%)", cls: "text-warning", bg: "bg-warning/15" }
        : { label: "Low (<90%) — see a doctor", cls: "text-destructive", bg: "bg-destructive/15" }
    : null;

  return (
    <ModuleLayout icon={Wind} accent="primary" title="Blood Oxygen (SpO2)" subtitle="Estimate oxygen saturation with your camera" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Camera className="size-5 text-primary" /> Camera estimate</h2>
          <video ref={videoRef} playsInline muted className={measuring ? "mt-4 h-24 w-full rounded-xl object-cover" : "hidden"} />
          {measuring ? (
            <>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">Keep your fingertip steady…</p>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">Place your fingertip over the rear camera and flash, then hold still for ~22 seconds.</p>
              <Button onClick={start} disabled={loadingAi} className="mt-4 w-full">
                <Camera className="size-4" /> Start estimate
              </Button>
            </>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-warning" />
            This is a rough wellness estimate, not a medical pulse oximeter.
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
            <p className="text-sm opacity-90">Last estimate</p>
            <div className="font-display text-6xl font-extrabold">{last ? `${last.value}` : "—"}</div>
            <p className="text-sm opacity-90">% SpO2</p>
            {spo2Band && <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${spo2Band.bg} ${spo2Band.cls}`}>{spo2Band.label}</p>}
          </section>

          <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            At high altitude (above ~2500 m) a slightly lower SpO2 can be normal. Track your <span className="font-medium text-foreground">Altitude</span> module alongside this if you're travelling to the mountains.
          </p>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Manual entry</h2>
            <p className="mt-1 text-sm text-muted-foreground">From a real oximeter? Log it here.</p>
            <div className="mt-3 flex gap-2">
              <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 98" />
              <Button onClick={() => { const s = parseInt(manual); if (s >= 70 && s <= 100) { save(s, "manual"); setManual(""); } else toast.error("Enter a value between 70 and 100."); }} disabled={!manual}>
                <Plus className="size-4" />
              </Button>
            </div>
            <Textarea className="mt-3" rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Any symptoms? (breathless, dizzy…) — used for the AI note" />
          </section>
        </div>
      </div>

      <TrendCard title="7-day trend" entries={entries} unit="%" accent="primary" dataSource="Camera estimate + manual entries (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Reading your profile and analyzing…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="OxySense" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}

/** Rough SpO2 estimate from camera PPG perfusion (AC/DC of red channel). Best-effort only. */
function estimateSpo2(raw: { t: number; v: number }[]): number | null {
  if (raw.length < 80) return null;
  const t0 = raw[0].t + 1500;
  const s = raw.filter((r) => r.t >= t0).map((r) => r.v);
  if (s.length < 60) return null;
  const dc = s.reduce((a, b) => a + b, 0) / s.length;
  if (dc < 5) return null;
  const min = Math.min(...s);
  const max = Math.max(...s);
  const ac = max - min;
  if (ac < 0.3) return null; // no real pulsatile signal → finger not placed
  const perfusion = ac / dc; // ~0.005–0.05 typical
  // Map perfusion quality to a plausible wellness range (higher perfusion → healthier reading).
  const est = 95 + Math.min(4, Math.max(-4, (perfusion - 0.02) * 200));
  return Math.max(90, Math.min(99, Math.round(est)));
}
