import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Wind, Play, Square } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getBreathing, logBreathing } from "@/lib/wellness.functions";
import { useActiveMember } from "@/lib/active-member";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/breathe")({
  head: () => ({ meta: [{ title: "Guided Breathing · Nirogi" }] }),
  component: BreathePage,
});

type Phase = { key: "inhale" | "hold" | "exhale" | "hold2"; label: string; sec: number };

const TECHNIQUES: Record<string, { name: string; desc: string; phases: Phase[] }> = {
  box: {
    name: "Box Breathing",
    desc: "Calm focus — used by athletes and forces. 4-4-4-4.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 4 },
      { key: "hold", label: "Hold", sec: 4 },
      { key: "exhale", label: "Breathe out", sec: 4 },
      { key: "hold2", label: "Hold", sec: 4 },
    ],
  },
  relax: {
    name: "4-7-8 Relaxing",
    desc: "Eases anxiety and helps you fall asleep.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 4 },
      { key: "hold", label: "Hold", sec: 7 },
      { key: "exhale", label: "Breathe out", sec: 8 },
    ],
  },
  coherent: {
    name: "Coherent Breathing",
    desc: "Balances heart-rate variability. 5-5.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 5 },
      { key: "exhale", label: "Breathe out", sec: 5 },
    ],
  },
};

function BreathePage() {
  const { memberId } = useActiveMember();
  const qc = useQueryClient();
  const getData = useServerFn(getBreathing);
  const log = useServerFn(logBreathing);

  const { data } = useQuery({ queryKey: ["breathing", memberId], queryFn: () => getData({ data: { memberId } }) });

  const [techKey, setTechKey] = useState<keyof typeof TECHNIQUES>("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const startedAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const tech = TECHNIQUES[techKey];
  const phase = tech.phases[phaseIdx];

  useEffect(() => {
    if (!running) return;
    setCount(phase.sec);
    let remaining = phase.sec;
    timer.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        setPhaseIdx((i) => {
          const next = (i + 1) % tech.phases.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
      }
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx, techKey]);

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setCycles(0);
    startedAt.current = Date.now();
  };

  const stop = async () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    const duration = Math.round((Date.now() - startedAt.current) / 1000);
    if (duration >= 10) {
      try {
        await log({ data: { memberId, technique: tech.name, duration_sec: duration, cycles } });
        toast.success(`Nice — ${cycles} cycles, ${Math.round(duration / 60)} min logged.`);
        qc.invalidateQueries({ queryKey: ["breathing", memberId] });
      } catch (e) {
        toastServerError(e);
      }
    }
    setPhaseIdx(0);
    setCycles(0);
  };

  const scale = phase?.key === "inhale" ? 1.35 : phase?.key === "exhale" ? 0.75 : phase?.key.startsWith("hold") ? (phaseIdx <= 1 ? 1.35 : 0.75) : 1;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wind className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Guided Breathing</h1>
            <p className="text-sm text-muted-foreground">Slow your heart, calm your mind</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(TECHNIQUES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { if (!running) setTechKey(k as keyof typeof TECHNIQUES); }}
              disabled={running}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                techKey === k ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
              } ${running ? "opacity-50" : ""}`}
            >
              {v.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{tech.desc}</p>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative flex size-64 items-center justify-center">
            <motion.div
              animate={{ scale: running ? scale : 1 }}
              transition={{ duration: running ? count || 1 : 0.5, ease: "easeInOut" }}
              className="absolute size-56 rounded-full bg-gradient-primary opacity-20"
            />
            <motion.div
              animate={{ scale: running ? scale : 1 }}
              transition={{ duration: running ? count || 1 : 0.5, ease: "easeInOut" }}
              className="absolute size-40 rounded-full bg-gradient-primary opacity-40"
            />
            <div className="z-10 text-center text-primary-foreground">
              <p className="font-display text-lg font-bold text-primary">{running ? phase.label : "Ready"}</p>
              {running && <p className="font-display text-5xl font-extrabold text-primary">{count}</p>}
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{running ? `Cycle ${cycles + 1}` : "Press start when you're ready"}</p>
          <div className="mt-4">
            {running ? (
              <Button onClick={stop} variant="destructive" size="lg"><Square className="size-4" /> Finish</Button>
            ) : (
              <Button onClick={start} size="lg"><Play className="size-4" /> Start session</Button>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Today" value={`${Math.round((data?.todaySec ?? 0) / 60)} min`} />
          <Stat label="Sessions (7d)" value={String(data?.weekSessions ?? 0)} />
          <Stat label="Technique" value={tech.name} />
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
