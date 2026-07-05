import { motion } from "framer-motion";
import { ShieldAlert, Lightbulb, Stethoscope, Gauge } from "lucide-react";
import type { ToolResult } from "@/lib/health-tools.server";
import { ReportActions } from "@/components/site/ReportActions";
import { cn } from "@/lib/utils";

const riskStyles: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  info: "bg-primary/10 text-primary border-primary/30",
  moderate: "bg-warning/10 text-warning border-warning/30",
  high: "bg-pulse/10 text-pulse border-pulse/30",
  urgent: "bg-destructive/10 text-destructive border-destructive/40",
};

const urgencyStyles: Record<string, string> = {
  normal: "bg-success/10 text-success border-success/30",
  watch: "bg-warning/10 text-warning border-warning/30",
  attention: "bg-pulse/10 text-pulse border-pulse/30",
  urgent: "bg-destructive/10 text-destructive border-destructive/40",
  emergency: "bg-destructive text-destructive-foreground border-destructive",
};

/**
 * Compact renderer for a ToolResult, reused by the sensor dashboard modules and
 * the voice SenseCheck page (the full tool pages use ToolRunner's own panel).
 */
export function AiResultPanel({ result, toolName }: { result: ToolResult; toolName: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase", riskStyles[result.riskLevel] ?? riskStyles.info)}>
          {result.riskLevel}
        </span>
        {result.urgency && (
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase", urgencyStyles[result.urgency] ?? urgencyStyles.normal)}>
            {result.urgency}
          </span>
        )}
        <h3 className="font-display text-lg font-semibold">{result.title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{result.summary}</p>

      {typeof result.preventionScore === "number" && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Gauge className="size-4 text-primary" /> Score
            </span>
            <span className="font-display text-lg font-bold">{result.preventionScore}/100</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.max(0, Math.min(100, result.preventionScore))}%` }} />
          </div>
        </div>
      )}

      {result.sugarImpact && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-3 text-center">
          <div>
            <div className="font-display text-base font-bold">{result.sugarImpact.score ?? "—"}</div>
            <div className="text-[11px] text-muted-foreground">Impact</div>
          </div>
          <div>
            <div className="font-display text-base font-bold">{result.sugarImpact.level ?? "—"}</div>
            <div className="text-[11px] text-muted-foreground">Level</div>
          </div>
          <div>
            <div className="font-display text-base font-bold">{result.sugarImpact.verdict ?? "—"}</div>
            <div className="text-[11px] text-muted-foreground">Verdict</div>
          </div>
        </div>
      )}

      {result.sections.map((s, i) => (
        <div key={i}>
          <h4 className="text-sm font-semibold">{s.heading}</h4>
          <ul className="mt-1.5 space-y-1.5">
            {s.items.map((item, j) => (
              <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="size-4" /> Warnings
          </h4>
          <ul className="mt-2 space-y-1.5">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-sm text-destructive/90">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-success">
            <Lightbulb className="size-4" /> Recommendations
          </h4>
          <ul className="mt-2 space-y-1.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-foreground/80">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {result.specialist && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-accent/40 p-4 text-sm">
          <Stethoscope className="size-4 text-primary" />
          <span>
            <span className="font-semibold">Consider seeing:</span> {result.specialist}
          </span>
        </div>
      )}

      <ReportActions source={{ toolName, result }} />
    </motion.div>
  );
}
