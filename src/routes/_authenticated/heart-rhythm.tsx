import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, HeartPulse, Camera, Loader2, Plus, Info } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getHeartRate, logHeartRate } from "@/lib/wellness.functions";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/heart-rhythm")({
  head: () => ({ meta: [{ title: "Heart Rhythm · Nirogi" }] }),
  component: HeartRhythmPage,
});

const MEASURE_MS = 20000;

function HeartRhythmPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const getData = useServerFn(getHeartRate);
  const log = useServerFn(logHeartRate);

  const { data } = useQuery({ queryKey: ["heart-rate", memberId], queryFn: () => getData({ data: { memberId } }) });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const samples = useRef<{ t: number; v: number }[]>([]);

  const [measuring, setMeasuring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signal, setSignal] = useState<number[]>([]);
  const [manual, setManual] = useState("");
  const [saving, setSaving] = useState(false);

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);

  const saveBpm = async (bpm: number, ctx: string) => {
    setSaving(true);
    try {
      const res = await log({ data: { memberId, bpm, context: ctx, lang } });
      toast.success(res?.note ?? "Heart rate logged.");
      qc.invalidateQueries({ queryKey: ["heart-rate", memberId] });
    } catch (e) {
      toastServerError(e);
    } finally {
      setSaving(false);
    }
  };

  const start = async () => {
    setSignal([]);
    samples.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 320, height: 240 },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      try {
        // Turn on torch if supported for a stronger PPG signal.
        await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
      } catch { /* torch unsupported */ }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMeasuring(true);
      toast.info("Cover the back camera + flash with your fingertip. Hold still.");

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
        const now = performance.now();
        samples.current.push({ t: now, v: red });
        setSignal((s) => [...s.slice(-80), red]);
        const elapsed = now - startT;
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
    const bpm = estimateBpm(samples.current);
    if (bpm) saveBpm(bpm, "camera");
    else toast.error("Couldn't read a clear pulse. Hold still and try again, or enter it manually.");
  };

  const last = data?.last;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-pulse/10 text-pulse"><HeartPulse className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Heart Rhythm</h1>
            <p className="text-sm text-muted-foreground">Measure your pulse with the camera (PPG)</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Camera className="size-5 text-pulse" /> Camera measurement</h2>
            <video ref={videoRef} playsInline muted className={measuring ? "mt-4 h-24 w-full rounded-xl object-cover" : "hidden"} />

            {measuring && (
              <>
                <div className="mt-3 h-14 w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                  <svg viewBox="0 0 320 56" preserveAspectRatio="none" className="h-full w-full">
                    <polyline
                      points={signal.map((v, i) => `${(i / 80) * 320},${56 - normalize(v, signal) * 48 - 4}`).join(" ")}
                      fill="none"
                      stroke="var(--color-pulse)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-pulse transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">Keep your fingertip steady on the camera…</p>
              </>
            )}

            {!measuring && (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  Place your fingertip gently over the rear camera and flash. Stay still for 20 seconds.
                </p>
                <Button onClick={start} disabled={saving} className="mt-4 w-full bg-pulse text-pulse-foreground hover:bg-pulse/90">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Start measurement
                </Button>
              </>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-warning" />
              Camera PPG is an estimate for wellness, not a medical ECG. It cannot detect heart attacks or arrhythmias.
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-gradient-pulse p-6 text-center text-pulse-foreground shadow-pulse">
              <p className="text-sm opacity-90">Last reading</p>
              <div className="font-display text-6xl font-extrabold">{last?.bpm ?? "—"}</div>
              <p className="text-sm opacity-90">bpm · avg {data?.avg ?? "—"}</p>
              {last?.ai_note && <p className="mt-3 text-xs opacity-90">{last.ai_note}</p>}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Manual entry</h2>
              <p className="mt-1 text-sm text-muted-foreground">Count beats for 15s and multiply by 4.</p>
              <div className="mt-3 flex gap-2">
                <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 72 bpm" />
                <Button onClick={() => { const b = parseInt(manual); if (b) { saveBpm(b, "manual"); setManual(""); } }} disabled={saving || !manual}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function normalize(v: number, arr: number[]) {
  if (arr.length < 2) return 0.5;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max - min < 0.001) return 0.5;
  return (v - min) / (max - min);
}

/** Estimate BPM from PPG samples using peak detection on a smoothed signal. */
function estimateBpm(raw: { t: number; v: number }[]): number | null {
  if (raw.length < 60) return null;
  // Drop the first second (auto-exposure settling).
  const t0 = raw[0].t + 1000;
  const s = raw.filter((r) => r.t >= t0);
  if (s.length < 40) return null;

  // Moving-average smooth.
  const win = 5;
  const vals = s.map((r) => r.v);
  const smooth = vals.map((_, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(vals.length - 1, i + win); j++) { sum += vals[j]; n++; }
    return sum / n;
  });
  // Detrend.
  const detr = vals.map((v, i) => v - smooth[i]);

  const mean = detr.reduce((a, b) => a + b, 0) / detr.length;
  const std = Math.sqrt(detr.reduce((a, b) => a + (b - mean) ** 2, 0) / detr.length);
  if (std < 0.05) return null;

  const peaks: number[] = [];
  for (let i = 2; i < detr.length - 2; i++) {
    if (detr[i] > mean + std * 0.4 && detr[i] >= detr[i - 1] && detr[i] > detr[i + 1]) {
      const lastPeak = peaks[peaks.length - 1];
      if (lastPeak === undefined || s[i].t - s[lastPeak].t > 300) peaks.push(i);
    }
  }
  if (peaks.length < 4) return null;

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) intervals.push(s[peaks[i]].t - s[peaks[i - 1]].t);
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const bpm = Math.round(60000 / median);
  if (bpm < 40 || bpm > 200) return null;
  return bpm;
}
