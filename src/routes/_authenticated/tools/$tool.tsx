import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { getTool, TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tools/$tool")({
  loader: ({ params }) => {
    const tool = getTool(params.tool);
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tool.name} · Nirogi` },
          { name: "description", content: loaderData.tool.description },
        ]
      : [{ title: "Tool · Nirogi" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Tool not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back home</Link>
      </div>
    </SiteLayout>
  ),
  component: ToolPage,
});

const accentRing: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  pulse: "text-pulse bg-pulse/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const Icon = tool.icon;

  return (
    <SiteLayout>
      <div className="border-b border-border/60 bg-gradient-mesh">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All tools
          </Link>
          <div className="mt-5 flex items-start gap-4">
            <span className={cn("inline-flex size-14 items-center justify-center rounded-2xl", accentRing[tool.accent])}>
              <Icon className="size-7" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold">{tool.name}</h1>
              <p className="text-primary">{tool.tagline}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-muted-foreground">{tool.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {tool.howItWorks.map((step: string, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-card/70 p-4 text-sm backdrop-blur">
                <span className="font-display font-bold text-primary">{i + 1}.</span> {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground/80">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>{tool.disclaimer}</p>
        </div>
        <ToolRunner tool={tool} />
      </div>
    </SiteLayout>
  );
}

export const _allTools = TOOLS;
