import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import { getHealthScore } from "@/lib/health-score.functions";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const bandColor: Record<string, string> = {
  Excellent: "text-success",
  Good: "text-primary",
  "Needs attention": "text-warning",
  "At risk": "text-destructive",
};

export function HealthScoreCard() {
  const { t } = useI18n();
  const fn = useServerFn(getHealthScore);
  const { data, isLoading } = useQuery({
    queryKey: ["health-score"],
    queryFn: () => fn(),
  });

  const score = data?.score ?? 0;
  const circumference = 2 * Math.PI * 52;
  const dash = (score / 100) * circumference;

  const top = [...(data?.factors ?? [])]
    .map((f) => ({ ...f, gap: f.max - f.points }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <TrendingUp className="size-5 text-primary" /> {t("dash.health_score", "Health Score")}
      </h2>

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative size-32 shrink-0">
              <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-extrabold">{score}</span>
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div>
              <p className={cn("font-display text-lg font-bold", bandColor[data?.band ?? ""] ?? "text-foreground")}>
                {data?.band}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{data?.message}</p>
            </div>
          </div>

          {top.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dash.focus_areas", "Where to focus")}
              </p>
              <div className="mt-2 space-y-2.5">
                {top.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground">{f.points}/{f.max}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-primary"
                        style={{ width: `${(f.points / f.max) * 100}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{f.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
