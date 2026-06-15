import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Upload, Loader2, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { analyzePrescription } from "@/lib/profile.functions";
import { cn } from "@/lib/utils";

type Stage = "idle" | "uploading" | "reading" | "analyzing" | "done" | "error";

const STEPS: { key: Stage; label: string }[] = [
  { key: "uploading", label: "Uploading file" },
  { key: "reading", label: "Reading the document" },
  { key: "analyzing", label: "Explaining in plain words" },
  { key: "done", label: "Done" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsDataURL(file);
  });
}

export function PrescriptionAnalyzer({ initial }: { initial?: string | null }) {
  const analyze = useServerFn(analyzePrescription);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string>("");
  const [analysis, setAnalysis] = useState<string | null>(initial ?? null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const order: Stage[] = ["uploading", "reading", "analyzing", "done"];
  const activeIndex = order.indexOf(stage);

  const process = async (file: File) => {
    setError("");
    setLastFile(file);
    if (file.size > 8 * 1024 * 1024) {
      setStage("error");
      setError("That file is over 8MB. Please upload a smaller, clearer photo.");
      return;
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setStage("error");
      setError("Please upload a clear photo or PDF of the prescription.");
      return;
    }

    try {
      setStage("uploading");
      const dataUrl = await fileToDataUrl(file);
      setStage("reading");
      await new Promise((r) => setTimeout(r, 300));
      setStage("analyzing");
      const res = await analyze({ data: { image: dataUrl } });
      setAnalysis(res.analysis);
      setStage("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setStage("error");
      if (msg.includes("RATE_LIMIT")) setError("Too many requests right now. Please try again in a moment.");
      else if (msg.includes("CREDITS_EXHAUSTED")) setError("AI usage limit reached. Please try again later.");
      else if (msg.includes("read-failed")) setError("Couldn't read that file. Try another photo.");
      else setError("Couldn't read the prescription. Try a clearer, well-lit photo.");
    }
  };

  const busy = stage === "uploading" || stage === "reading" || stage === "analyzing";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <FileText className="size-5 text-primary" /> Prescription reader
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a prescription photo or PDF and AI explains it in simple words. Stored privately to you and saved to your history.
      </p>

      {/* Stepper */}
      {(busy || stage === "done") && (
        <ol className="mt-4 space-y-2">
          {STEPS.map((s) => {
            const idx = order.indexOf(s.key);
            const isDone = activeIndex > idx || stage === "done";
            const isActive = stage === s.key && stage !== "done";
            return (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-xs",
                    isDone
                      ? "border-success bg-success/15 text-success"
                      : isActive
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : isActive ? <Loader2 className="size-3.5 animate-spin" /> : idx + 1}
                </span>
                <span className={cn(isActive ? "text-foreground" : isDone ? "text-foreground/70" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Error */}
      {stage === "error" && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-4" /> Something went wrong
          </p>
          <p className="mt-1 text-destructive/90">{error}</p>
          {lastFile && (
            <button
              onClick={() => lastFile && process(lastFile)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <RotateCcw className="size-3.5" /> Retry
            </button>
          )}
        </div>
      )}

      {/* Upload control */}
      {!busy && (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center hover:bg-muted">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) process(f);
            }}
          />
          <Upload className="size-5 text-muted-foreground" />
          <span className="mt-2 text-sm text-muted-foreground">
            {stage === "done" || stage === "error" ? "Upload another prescription" : "Upload prescription (photo or PDF)"}
          </span>
        </label>
      )}

      {/* Result */}
      {analysis && (stage === "done" || stage === "idle") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground/80"
        >
          {analysis}
        </motion.div>
      )}
    </section>
  );
}
