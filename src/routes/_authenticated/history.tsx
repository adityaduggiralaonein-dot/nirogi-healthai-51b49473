import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, History as HistoryIcon, ChevronDown, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getMyHistory, type HistoryItem } from "@/lib/history.functions";
import { getToolName } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Your history · Nirogi" }] }),
  component: HistoryPage,
});

const riskStyles: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  info: "bg-primary/10 text-primary border-primary/30",
  moderate: "bg-warning/10 text-warning border-warning/30",
  high: "bg-pulse/10 text-pulse border-pulse/30",
  urgent: "bg-destructive/10 text-destructive border-destructive/40",
};

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function HistoryPage() {
  const fetchHistory = useServerFn(getMyHistory);
  const { data, isLoading } = useQuery({ queryKey: ["my-history"], queryFn: () => fetchHistory() });
  const items = data?.items ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
              <HistoryIcon className="size-7 text-primary" /> Medical history
            </h1>
            <p className="mt-1 text-muted-foreground">Every tool run, prescription and meal scan you've made, newest first.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-primary underline">Back to dashboard</Link>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <p>No history yet. Run a tool or analyze a prescription and it'll appear here.</p>
            <Link to="/" className="mt-3 inline-block text-primary underline">Explore the tools</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((it) => <HistoryRow key={`${it.kind}-${it.id}`} item={it} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false);
  const result = item.result as { sections?: { heading: string; items: string[] }[]; analysis?: string; recommendations?: string[] } | null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {item.kind === "prescription" ? <FileText className="size-3" /> : null}
              {getToolName(item.tool)}
            </span>
            {item.riskLevel && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", riskStyles[item.riskLevel] ?? riskStyles.info)}>
                {item.riskLevel}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{fmt(item.created_at)}</span>
          </div>
          <p className="mt-1 truncate font-display text-sm font-semibold">{item.title}</p>
          <p className="truncate text-sm text-muted-foreground">{item.summary}</p>
        </div>
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-4 text-sm">
          {result?.analysis && (
            <p className="whitespace-pre-wrap text-foreground/80">{result.analysis}</p>
          )}
          {result?.sections?.map((s, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold">{s.heading}</h4>
              <ul className="mt-1 space-y-1">
                {s.items.map((x, j) => (
                  <li key={j} className="flex gap-2 text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {result?.recommendations && result.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold">Recommendations</h4>
              <ul className="mt-1 space-y-1">
                {result.recommendations.map((r, i) => <li key={i} className="text-foreground/80">{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
