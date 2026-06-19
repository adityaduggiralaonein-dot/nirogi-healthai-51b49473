import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Moon, Loader2, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { getSleep, logSleep, deleteSleep } from "@/lib/wellness.functions";
import { ReportActions } from "@/components/site/ReportActions";

export const Route = createFileRoute("/_authenticated/sleep-tracker")({
  head: () => ({ meta: [{ title: "Sleep Tracker · Nirogi" }] }),
  component: SleepTracker,
});

function fmtDur(min: number | null) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function SleepTracker() {
  const { t, lang } = useI18n();
  const { memberId, memberName } = useActiveMember();
  const qc = useQueryClient();
  const fnGet = useServerFn(getSleep);
  const fnLog = useServerFn(logSleep);
  const fnDel = useServerFn(deleteSleep);

  const [bedtime, setBedtime] = useState("22:30");
  const [wake, setWake] = useState("06:30");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["sleep", memberId], queryFn: () => fnGet({ data: { memberId } }) });

  const submit = async () => {
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      // bedtime is last night, wake is this morning
      await fnLog({
        data: {
          memberId,
          bedtime: `${yest}T${bedtime}:00`,
          wake_time: `${today}T${wake}:00`,
          notes: notes || null,
          lang,
        },
      });
      setNotes("");
      await qc.invalidateQueries({ queryKey: ["sleep", memberId] });
      qc.invalidateQueries({ queryKey: ["health-score"] });
      toast.success("Sleep logged and analysed.");
    } catch {
      toast.error("Couldn't log sleep. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const latest = data?.logs?.[0];
  const analysis = latest?.ai_analysis as { score?: number; summary?: string; tips?: string[]; flags?: string[] } | null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("nav.dashboard", "Dashboard")}
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Moon className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("sleep.title", "Sleep Tracker")}</h1>
            <p className="text-sm text-muted-foreground">
              {memberName ? `${memberName} · ` : ""}{t("sleep.sub", "Log your nights and get an AI sleep-quality report.")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
                <p className="font-display text-2xl font-bold">{fmtDur(data?.avgDuration ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{t("sleep.avg_dur", "Avg sleep (7 nights)")}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
                <p className="font-display text-2xl font-bold">{data?.avgScore || "—"}<span className="text-sm text-muted-foreground">/100</span></p>
                <p className="text-xs text-muted-foreground">{t("sleep.avg_score", "Avg quality")}</p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{t("sleep.log_night", "Log last night")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">{t("sleep.bedtime", "Bedtime")}</Label>
                  <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5">{t("sleep.waketime", "Wake time")}</Label>
                  <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label className="mb-1.5">{t("sleep.notes", "How did you sleep? (snoring, waking up, dreams, sounds)")}</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. woke up twice, snored a lot, restless" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("sleep.voice_note", "Tip: describe any sounds or snoring you noticed — the AI uses this to flag possible sleep-apnea patterns.")}
                </p>
              </div>
              <Button onClick={submit} disabled={busy} className="mt-4 w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {busy ? t("sleep.analysing", "Analysing…") : t("sleep.analyse", "Save & analyse")}
              </Button>
            </section>

            {analysis && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">{t("sleep.report", "Latest sleep report")}</h2>
                  <span className="font-display text-2xl font-bold text-primary">{analysis.score}<span className="text-sm text-muted-foreground">/100</span></span>
                </div>
                <p className="mt-2 text-sm text-foreground/80">{analysis.summary}</p>
                {(analysis.flags?.length ?? 0) > 0 && (
                  <div className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
                    {analysis.flags!.map((f, i) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-warning-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {f}</p>
                    ))}
                  </div>
                )}
                {(analysis.tips?.length ?? 0) > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                    {analysis.tips!.map((tp, i) => <li key={i}>{tp}</li>)}
                  </ul>
                )}
                <div className="mt-4">
                  <ReportActions source={{ toolName: "Sleep report", text: `Sleep quality: ${analysis.score}/100\n\n${analysis.summary}\n\nTips:\n${(analysis.tips ?? []).join("\n")}` }} />
                </div>
              </section>
            )}

            {(data?.logs.length ?? 0) > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">{t("sleep.history", "Sleep history")}</h2>
                <div className="mt-3 space-y-2">
                  {data!.logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{fmtDur(l.duration_min)}{l.quality_score ? ` · ${l.quality_score}/100` : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.bedtime ? new Date(l.bedtime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"} → {l.wake_time ? new Date(l.wake_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>
                      </div>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {new Date(l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <button onClick={async () => { await fnDel({ data: { id: l.id } }); qc.invalidateQueries({ queryKey: ["sleep", memberId] }); }} aria-label="Delete">
                          <Trash2 className="size-4 hover:text-destructive" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
