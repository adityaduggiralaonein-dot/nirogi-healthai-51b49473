import { useState } from "react";
import { AlertTriangle, Siren, Phone, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ToolDef } from "@/lib/tools";

/**
 * Compact clinical safety line shown below the tool details. A danger-triangle
 * button opens the full disclaimer with red-flag symptoms and emergency numbers.
 */
export function ClinicalDisclaimer({ tool }: { tool: ToolDef }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="View full disclaimer and emergency numbers"
            className="mt-0.5 shrink-0 rounded-md p-0.5 text-warning transition-colors hover:bg-warning/15"
          >
            <AlertTriangle className="size-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" /> Important disclaimer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground/85">
              <p className="font-semibold text-foreground">Educational only — not a medical diagnosis</p>
              <p className="mt-1">{tool.disclaimer}</p>
            </div>

            {tool.redFlags.length > 0 && (
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
        </DialogContent>
      </Dialog>

      <p className="leading-relaxed">
        Educational guidance only — not a medical diagnosis.{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-warning underline-offset-2 hover:underline"
        >
          View full disclaimer & emergency numbers
        </button>
      </p>
    </div>
  );
}
