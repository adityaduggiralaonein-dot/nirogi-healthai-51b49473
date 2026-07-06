import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Wind, Loader2, Plus } from "lucide-react";
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
import { appendEntry, loadEntries, type ModuleEntry } from "@/lib/local-health";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/stress")({
  head: () => ({ meta: [{ title: "Stress & Mental Health · Nirogi" }] }),
  component: StressPage,
});

const MODULE = "mood";
const MOODS = [
  { v: 1, emoji: "😫", label: "Awful" },
  { v: 2, emoji: "😟", label: "Low" },
  { v: 3, emoji: "🙁", label: "Meh" },
  { v: 4, emoji: "😐", label: "Okay" },
  { v: 5, emoji: "😊", label: "Great" },
];

const disclaimer = moduleDisclaimer({
  name: "StressSense",
  disclaimer:
    "This mood check-in is a supportive wellbeing tool, not therapy or a diagnosis. If you are struggling, please reach out to a mental-health professional or a helpline.",
  redFlags: [
    "Thoughts of harming yourself or others",
    "Feeling hopeless or unable to cope for days",
    "Panic, chest tightness or inability to function",
  ],
  emergency: "If you feel unsafe or have thoughts of self-harm, call Tele-MANAS 14416 or KIRAN 1800-599-0019 now, or 112 for emergencies.",
});

function StressPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  const save = async () => {
    if (mood == null) {
      toast.error("Pick how you're feeling first.");
      return;
    }
    setEntries(appendEntry(MODULE, { value: mood, note: journal.trim() || undefined, source: "manual" }));
    toast.success("Mood logged.");
    setLoadingAi(true);
    try {
      const res = await run({
        data: {
          tool: "moodcheck",
          fields: { mood: `${mood}/5 (${MOODS.find((m) => m.v === mood)?.label})`, journal: journal.trim() || "none" },
          image: null, file: null, fileName: null, lang, memberId,
        },
      });
      setResult(res as ToolResult);
      setJournal("");
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const week = entries.slice(-7);

  return (
    <ModuleLayout icon={Brain} accent="primary" title="Stress & Mental Health" subtitle="A daily mood check-in with a gentle AI reflection" disclaimer={disclaimer}>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">How are you feeling today?</h2>
        <div className="mt-4 flex justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.v}
              onClick={() => setMood(m.v)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                mood === m.v ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
              )}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
        <Textarea className="mt-4" rows={3} value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Want to add a note? What's on your mind…" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={loadingAi || mood == null}>
            {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Log check-in
          </Button>
          <Button asChild variant="outline">
            <Link to="/breathe"><Wind className="size-4" /> Breathing exercise</Link>
          </Button>
        </div>
      </section>

      {week.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Recent check-ins</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {week.map((e, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl border border-border px-3 py-2">
                <span className="text-2xl">{MOODS.find((m) => m.v === Math.round(e.value))?.emoji ?? "🙂"}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(e.t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No check-ins yet. Log your first mood above.
        </p>
      )}

      <TrendCard title="7-day mood trend" entries={entries} unit="/5" accent="primary" dataSource="Your daily mood check-ins (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI reflection</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Thinking about your check-in…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="StressSense" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
