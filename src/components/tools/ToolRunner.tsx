import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Stethoscope,
  ShieldAlert,
  Lightbulb,
  Mic,
  FileText,
  Gauge,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolDef } from "@/lib/tools";
import type { ToolResult } from "@/lib/health-tools.server";
import { ClinicalDisclaimer } from "@/components/site/ClinicalDisclaimer";
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ToolRunner({ tool }: { tool: ToolDef }) {
  const run = useServerFn(runTool);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [docFile, setDocFile] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>("");
  const [docIsPdf, setDocIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  const setField = (name: string, value: string) =>
    setFields((f) => ({ ...f, [name]: value }));

  const startVoice = (name: string) => {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    // @ts-expect-error - browser speech API
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const text = e.results[0][0].transcript;
      setField(name, ((fields[name] ?? "") + " " + text).trim());
    };
    rec.onerror = () => toast.error("Couldn't capture audio. Try again.");
    rec.start();
    toast.info("Listening… speak now.");
  };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB).");
      return;
    }
    const url = await fileToDataUrl(file);
    setImage(url);
    setImageName(file.name);
  };

  const onDoc = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB).");
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !file.type.startsWith("image/")) {
      toast.error("Please upload an image (X-ray/scan) or a PDF report.");
      return;
    }
    const url = await fileToDataUrl(file);
    setDocFile(url);
    setDocName(file.name);
    setDocIsPdf(isPdf);
  };

  const submit = async () => {
    for (const f of tool.fields) {
      if (f.required && f.type === "image" && !image) {
        toast.error(`${f.label} is required.`);
        return;
      }
      if (f.required && f.type === "file" && !docFile) {
        toast.error(`${f.label} is required.`);
        return;
      }
      if (f.required && f.type !== "image" && f.type !== "file" && !fields[f.name]?.trim()) {
        toast.error(`${f.label} is required.`);
        return;
      }
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await run({
        data: {
          tool: tool.slug,
          fields,
          image,
          file: docFile,
          fileName: docName || null,
        },
      });
      setResult(res as ToolResult);
      toast.success("Analysis ready.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RATE_LIMIT")) toast.error("Too many requests right now. Please try again shortly.");
      else if (msg.includes("CREDITS_EXHAUSTED")) toast.error("AI usage limit reached. Please try again later.");
      else toast.error("Something went wrong analyzing your input. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Your details</h2>
        <div className="mt-5 space-y-4">
          {tool.fields.map((f) => (
            <div key={f.name}>
              <Label className="mb-1.5 flex items-center justify-between">
                <span>
                  {f.label}
                  {f.required && <span className="text-pulse"> *</span>}
                </span>
                {f.voice && (
                  <button
                    type="button"
                    onClick={() => startVoice(f.name)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Mic className="size-3.5" /> Speak
                  </button>
                )}
              </Label>

              {f.type === "text" && (
                <Input
                  value={fields[f.name] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
              {f.type === "number" && (
                <Input
                  type="number"
                  value={fields[f.name] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
              {f.type === "textarea" && (
                <Textarea
                  value={fields[f.name] ?? ""}
                  placeholder={f.placeholder}
                  rows={3}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
              {f.type === "select" && (
                <Select value={fields[f.name] ?? ""} onValueChange={(v) => setField(f.name, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {f.type === "image" && (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onImage(e.target.files?.[0])}
                  />
                  {image ? (
                    <img src={image} alt="preview" className="max-h-40 rounded-lg object-contain" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Tap to upload or take a photo</span>
                  )}
                  {imageName && <span className="mt-2 text-xs text-muted-foreground">{imageName}</span>}
                </label>
              )}
              {f.type === "file" && (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => onDoc(e.target.files?.[0])}
                  />
                  {docFile && !docIsPdf ? (
                    <img src={docFile} alt="preview" className="max-h-40 rounded-lg object-contain" />
                  ) : docFile && docIsPdf ? (
                    <span className="inline-flex items-center gap-2 text-sm text-foreground/80">
                      <FileText className="size-5 text-primary" /> PDF ready
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Upload a scan image or PDF report</span>
                  )}
                  {docName && <span className="mt-2 text-xs text-muted-foreground">{docName}</span>}
                </label>
              )}
            </div>
          ))}
        </div>

        <Button onClick={submit} disabled={loading} size="lg" className="mt-6 w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Analyzing…" : tool.cta}
        </Button>
      </div>

      {/* Result */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Result</h2>
        {!result && !loading && (
          <p className="mt-6 text-sm text-muted-foreground">
            Your personalized AI report will appear here. It reads your saved health profile to tailor the result.
          </p>
        )}
        {loading && (
          <div className="mt-10 flex flex-col items-center text-center text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-sm">Reading your profile and analyzing…</p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-5"
          >
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
                    <Gauge className="size-4 text-primary" /> Prevention Score
                  </span>
                  <span className="font-display text-lg font-bold">{result.preventionScore}/100</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${Math.max(0, Math.min(100, result.preventionScore))}%` }}
                  />
                </div>
              </div>
            )}

            {result.sugarImpact && (
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-3 text-center">
                <div>
                  <div className="font-display text-base font-bold">{result.sugarImpact.score ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">Sugar Impact</div>
                </div>
                <div>
                  <div className="font-display text-base font-bold">{result.sugarImpact.glycemicIndex ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">Glycemic Index</div>
                </div>
                <div>
                  <div className="font-display text-base font-bold">{result.sugarImpact.verdict ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">Verdict</div>
                </div>
              </div>
            )}

            {result.nutrition && (
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-3 text-center">
                {[
                  ["kcal", result.nutrition.calories],
                  ["Protein g", result.nutrition.protein_g],
                  ["Sugar g", result.nutrition.sugar_g],
                  ["Sodium mg", result.nutrition.sodium_mg],
                  ["Sat fat g", result.nutrition.saturated_fat_g],
                  ["Fibre g", result.nutrition.fibre_g],
                ].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="font-display text-base font-bold">{val ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                  </div>
                ))}
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
