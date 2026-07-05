import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sun, Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, TrendCard, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { appendEntry, latestEntry, loadEntries, type ModuleEntry } from "@/lib/local-health";

export const Route = createFileRoute("/_authenticated/dashboard/uv")({
  head: () => ({ meta: [{ title: "UV & Skin Exposure · Nirogi" }] }),
  component: UvPage,
});

const MODULE = "uv";
const SKIN = ["Very fair (burns easily)", "Fair", "Medium / olive", "Brown", "Dark brown / black"];

const disclaimer = moduleDisclaimer({
  name: "UVGuard",
  disclaimer:
    "UVGuard uses public weather UV data and general sun-safety guidance. Safe-exposure times are rough estimates that vary with altitude, reflection and skin. It cannot assess your skin for damage — see a dermatologist for any changing mole or spot.",
  redFlags: [
    "A mole that is changing shape, colour, size or bleeding",
    "A sore or spot that won't heal for weeks",
    "Severe sunburn with blistering, fever or dizziness",
  ],
  emergency:
    "Severe sunburn with blistering, fever, confusion or fainting can mean heat illness — get to shade, hydrate and call 112 / 108 if severe.",
});

function UvPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [uv, setUv] = useState<number | null>(null);
  const [place, setPlace] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [skin, setSkin] = useState(SKIN[1]);
  const [manual, setManual] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  const fetchUv = () => {
    if (!navigator.geolocation) { toast.error("Location isn't available. Enter the UV index manually."); return; }
    setFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=uv_index`);
          const json = await res.json();
          const value = json?.current?.uv_index;
          if (typeof value === "number") {
            setUv(value);
            setPlace(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            record(value, "live");
          } else toast.error("Couldn't read the UV index. Try manual entry.");
        } catch {
          toast.error("Couldn't fetch UV data. Try manual entry.");
        } finally {
          setFetching(false);
        }
      },
      () => { toast.error("Location permission denied. Enter the UV index manually."); setFetching(false); },
      { timeout: 10000 },
    );
  };

  const record = async (value: number, source: string) => {
    setUv(value);
    setEntries(appendEntry(MODULE, { value, source }));
    setLoadingAi(true);
    try {
      const res = await run({
        data: {
          tool: "uvguard",
          fields: { uv_index: `${value}`, skin_type: skin, location: place || "not shared" },
          image: null,
          file: null,
          fileName: null,
          lang,
          memberId,
        },
      });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const last = latestEntry(MODULE);

  return (
    <ModuleLayout icon={Sun} accent="warning" title="UV & Skin Exposure" subtitle="Check today's UV and your safe sun time" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Get today's UV</h2>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium">Your skin type</label>
            <Select value={skin} onValueChange={setSkin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SKIN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={fetchUv} disabled={fetching || loadingAi} className="mt-4 w-full">
            {fetching ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />} Use my location
          </Button>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">Or enter UV index manually</label>
            <div className="flex gap-2">
              <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 8" />
              <Button onClick={() => { const v = parseFloat(manual); if (v >= 0 && v <= 20) { record(v, "manual"); setManual(""); } else toast.error("Enter a value between 0 and 20."); }} disabled={!manual || loadingAi}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
          <p className="text-sm opacity-90">Current UV index</p>
          <div className="font-display text-6xl font-extrabold">{uv ?? (last ? last.value : "—")}</div>
          <p className="text-sm opacity-90">{place ? place : "0 low · 3-5 moderate · 6-7 high · 8+ very high"}</p>
        </section>
      </div>

      <TrendCard title="7-day UV trend" entries={entries} unit="UV" accent="warning" dataSource="Open-Meteo UV API + manual entries (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Building your sun-safety plan…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="UVGuard" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
