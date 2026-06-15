import { AlertTriangle, Siren, Phone, ShieldAlert } from "lucide-react";
import type { ToolDef } from "@/lib/tools";

/**
 * Prominent clinical safety block: educational disclaimer, tool-specific
 * red-flag symptoms, and India emergency resources. Shown on every tool page
 * and alongside every result.
 */
export function ClinicalDisclaimer({ tool, compact = false }: { tool: ToolDef; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {/* Educational disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground/85">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="font-semibold text-foreground">Educational only — not a medical diagnosis</p>
          <p className="mt-1">{tool.disclaimer}</p>
        </div>
      </div>

      {/* Red flags */}
      {!compact && tool.redFlags.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="size-4" /> Seek care urgently if you have any of these
          </h4>
          <ul className="mt-2 space-y-1.5">
            {tool.redFlags.map((rf, i) => (
              <li key={i} className="flex gap-2 text-sm text-destructive/90">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
                {rf}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emergency resources */}
      <div className="rounded-xl border border-destructive/50 bg-destructive/15 p-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-destructive">
          <Siren className="size-4" /> In an emergency
        </h4>
        <p className="mt-1.5 text-sm text-foreground/85">{tool.emergency}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 bg-background px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Phone className="size-3.5" /> Call 112 · Emergency
          </a>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 bg-background px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Phone className="size-3.5" /> Call 108 · Ambulance
          </a>
          <a
            href="tel:9152987821"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted"
          >
            <Phone className="size-3.5" /> Mental health · 9152987821
          </a>
        </div>
      </div>
    </div>
  );
}
