import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, type LucideIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Accent = "primary" | "pulse" | "success" | "warning";

export type Band = { max: number; label: string; tone: "success" | "warning" | "pulse" | "destructive" };

const toneClass: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  pulse: "text-pulse",
  destructive: "text-destructive",
};

export type TrackerType = { value: string; label: string };

export interface SimpleTrackerProps {
  module: string;
  icon: LucideIcon;
  accent: Accent;
  title: string;
  subtitle: string;
  unit: string;
  /** runTool slug used for the AI insight. */
  aiTool: string;
  aiName: string;
  /** Extra fields sent to the AI besides the latest value. */
  buildFields?: (latest: ModuleEntry | null, entries: ModuleEntry[]) => Record<string, string>;
  disclaimer: ReturnType<typeof moduleDisclaimer>;
  manualPlaceholder: string;
  min: number;
  max: number;
  step?: number;
  /** Optional reading types (e.g. fasting / post-meal). */
  types?: TrackerType[];
  /** Colour bands for the latest reading (ascending by max). */
  bands?: Band[];
  dataSource?: string;
  /** Extra content rendered above the manual-entry card. */
  intro?: ReactNode;
  /** Ask for a short symptom/context note used only for the AI. */
  noteLabel?: string;
}

export function SimpleTracker(props: SimpleTrackerProps) {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [value, setValue] = useState("");
  const [type, setType] = useState(props.types?.[0]?.value ?? "");
  const [note, setNote] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(props.module)), [props.module]);

  const last = latestEntry(props.module);
  const band = useMemo(() => {
    if (last == null || !props.bands) return null;
    return props.bands.find((b) => last.value <= b.max) ?? props.bands[props.bands.length - 1];
  }, [last, props.bands]);

  const insight = async (v: number) => {
    setLoadingAi(true);
    try {
      const base: Record<string, string> = { reading: `${v} ${props.unit}` };
      if (type) base.type = props.types?.find((t) => t.value === type)?.label ?? type;
      if (note.trim()) base.note = note.trim();
      const fields = { ...base, ...(props.buildFields?.(latestEntry(props.module), loadEntries(props.module)) ?? {}) };
      const res = await run({
        data: { tool: props.aiTool, fields, image: null, file: null, fileName: null, lang, memberId },
      });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const log = () => {
    const v = parseFloat(value);
    if (isNaN(v) || v < props.min || v > props.max) {
      toast.error(`Enter a value between ${props.min} and ${props.max}.`);
      return;
    }
    const next = appendEntry(props.module, { value: v, source: "manual", note: type || undefined });
    setEntries(next);
    setValue("");
    toast.success(`${props.title} logged.`);
    insight(v);
  };

  return (
    <ModuleLayout icon={props.icon} accent={props.accent} title={props.title} subtitle={props.subtitle} disclaimer={props.disclaimer}>
      {props.intro}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn("rounded-2xl border border-border p-6 text-center shadow-elegant", "bg-gradient-primary text-primary-foreground")}>
          <p className="text-sm opacity-90">Latest reading</p>
          <div className="font-display text-6xl font-extrabold">{last ? last.value : "—"}</div>
          <p className="text-sm opacity-90">{props.unit}</p>
          {band && <p className="mt-2 inline-block rounded-full bg-background/20 px-3 py-1 text-sm font-semibold">{band.label}</p>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Log manually</h2>
          {props.types && (
            <div className="mt-3 flex flex-wrap gap-2">
              {props.types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Input type="number" step={props.step ?? 1} value={value} onChange={(e) => setValue(e.target.value)} placeholder={props.manualPlaceholder} />
            <Button onClick={log} disabled={!value || loadingAi}>
              <Plus className="size-4" />
            </Button>
          </div>
          {props.noteLabel && (
            <Textarea className="mt-3" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={props.noteLabel} />
          )}
          {last && band && (
            <p className={cn("mt-3 text-sm font-medium", toneClass[band.tone])}>Current status: {band.label}</p>
          )}
        </section>
      </div>

      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No data yet. Enable a data source in Connected Devices or log manually above.
        </p>
      )}

      <TrendCard title="7-day trend" entries={entries} unit={props.unit} accent={props.accent} dataSource={props.dataSource ?? "Manual entries (stored on this device)"} />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Reading your profile and analyzing…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName={props.aiName} /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
