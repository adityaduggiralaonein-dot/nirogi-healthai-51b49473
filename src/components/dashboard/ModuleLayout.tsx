import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Radio, type LucideIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ClinicalDisclaimer } from "@/components/site/ClinicalDisclaimer";
import { weekSeries, type ModuleEntry } from "@/lib/local-health";
import type { ToolDef } from "@/lib/tools";
import { cn } from "@/lib/utils";

const accentRing: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  pulse: "text-pulse bg-pulse/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

const stroke: Record<string, string> = {
  primary: "var(--color-primary)",
  pulse: "var(--color-pulse)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
};

/** Build a minimal ToolDef so ClinicalDisclaimer can render for a module. */
export function moduleDisclaimer(partial: Pick<ToolDef, "name" | "disclaimer" | "redFlags" | "emergency">): ToolDef {
  return {
    slug: "module",
    tagline: "",
    description: "",
    icon: Radio,
    accent: "primary",
    howItWorks: [],
    fields: [],
    cta: "",
    ...partial,
  };
}

export function ModuleLayout({
  icon: Icon,
  accent,
  title,
  subtitle,
  children,
  disclaimer,
}: {
  icon: LucideIcon;
  accent: "primary" | "pulse" | "success" | "warning";
  title: string;
  subtitle: string;
  children: ReactNode;
  disclaimer: ToolDef;
}) {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className={cn("flex size-11 items-center justify-center rounded-2xl", accentRing[accent])}>
            <Icon className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">{children}</div>

        <div className="mt-6">
          <ClinicalDisclaimer tool={disclaimer} />
        </div>
      </div>
    </SiteLayout>
  );
}

export function TrendCard({
  title,
  entries,
  unit,
  accent,
  dataSource,
}: {
  title: string;
  entries: ModuleEntry[];
  unit: string;
  accent: "primary" | "pulse" | "success" | "warning";
  dataSource: string;
}) {
  const series = weekSeries(entries);
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {series.length > 1 ? (
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v) => [`${v} ${unit}`, ""]} />
              <Line type="monotone" dataKey="value" stroke={stroke[accent]} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Log a few readings over different days to see your 7-day trend.</p>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Radio className="size-3" /> Data source: {dataSource}
      </p>
    </section>
  );
}
