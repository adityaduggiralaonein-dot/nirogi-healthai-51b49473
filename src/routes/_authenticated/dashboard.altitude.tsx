import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mountain, Loader2, MapPin, Plus, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ModuleLayout, TrendCard, moduleDisclaimer } from "@/components/dashboard/ModuleLayout";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { appendEntry, latestEntry, latestValue, loadEntries, type ModuleEntry } from "@/lib/local-health";

export const Route = createFileRoute("/_authenticated/dashboard/altitude")({
  head: () => ({ meta: [{ title: "Altitude & Breathing · Nirogi" }] }),
  component: AltitudePage,
});

const MODULE = "altitude";

const disclaimer = moduleDisclaimer({
  name: "AltitudeGuide",
  disclaimer:
    "AltitudeGuide uses your phone's GPS or barometer to estimate altitude and gives general acclimatisation guidance. It cannot diagnose altitude sickness — if you feel unwell at height, descend and seek help.",
  redFlags: [
    "Severe headache, vomiting or confusion at altitude",
    "Breathlessness at rest or a persistent cough with frothy spit",
    "Trouble walking straight or extreme drowsiness (possible HACE/HAPE)",
  ],
  emergency:
    "Confusion, severe breathlessness or loss of coordination at altitude is a life-threatening emergency — descend immediately and call for rescue / 112.",
});

function band(m: number) {
  if (m < 1500) return { label: "Low altitude", tone: "text-success" };
  if (m < 2500) return { label: "Moderate", tone: "text-warning" };
  if (m < 3500) return { label: "High — AMS risk", tone: "text-pulse" };
  return { label: "Very high — serious risk", tone: "text-destructive" };
}

function AltitudePage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);

  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [pressure, setPressure] = useState<number | null>(null);
  const [manual, setManual] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  useEffect(() => setEntries(loadEntries(MODULE)), []);

  // Best-effort barometer read via the Generic Sensor API (Android Chrome only).
  useEffect(() => {
    let sensor: { stop: () => void } | null = null;
    try {
      const PressureSensor = (window as unknown as { PressureSensor?: new () => any }).PressureSensor;
      if (PressureSensor) {
        const s: any = new PressureSensor();
        s.addEventListener("reading", () => {
          if (typeof s.pressure === "number") setPressure(Math.round(s.pressure));
        });
        s.start();
        sensor = s;
      }
    } catch {
      /* barometer unavailable */
    }
    return () => { try { sensor?.stop(); } catch { /* noop */ } };
  }, []);

  const record = async (metres: number, source: string) => {
    setEntries(appendEntry(MODULE, { value: Math.round(metres), source }));
    setLoadingAi(true);
    try {
      const spo2 = latestValue("oxygen");
      const res = await run({
        data: {
          tool: "altitude",
          fields: {
            altitude_m: `${Math.round(metres)}`,
            pressure_hpa: pressure != null ? `${pressure}` : "not available",
            latest_spo2: spo2 != null ? `${spo2}%` : "not logged",
          },
          image: null, file: null, fileName: null, lang, memberId,
        },
      });
      setResult(res as ToolResult);
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const useGps = () => {
    if (!navigator.geolocation) { toast.error("Location isn't available. Enter altitude manually."); return; }
    setFetching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFetching(false);
        const alt = pos.coords.altitude;
        if (alt != null && !isNaN(alt)) record(alt, "gps");
        else toast.error("Your device didn't report altitude. Enter it manually.");
      },
      () => { setFetching(false); toast.error("Location permission denied. Enter altitude manually."); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const last = latestEntry(MODULE);
  const b = last ? band(last.value) : null;

  return (
    <ModuleLayout icon={Mountain} accent="primary" title="Altitude & Breathing" subtitle="Track your altitude and acclimatise safely" disclaimer={disclaimer}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
          <p className="text-sm opacity-90">Current altitude</p>
          <div className="font-display text-6xl font-extrabold">{last ? last.value : "—"}</div>
          <p className="text-sm opacity-90">metres</p>
          {b && <p className="mt-2 inline-block rounded-full bg-background/20 px-3 py-1 text-sm font-semibold">{b.label}</p>}
          {pressure != null && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs opacity-90"><Gauge className="size-3.5" /> {pressure} hPa</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Get your altitude</h2>
          <Button onClick={useGps} disabled={fetching || loadingAi} className="mt-4 w-full">
            {fetching ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />} Use GPS altitude
          </Button>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">Or enter altitude manually (m)</label>
            <div className="flex gap-2">
              <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 2400" />
              <Button onClick={() => { const v = parseFloat(manual); if (v >= -430 && v <= 9000) { record(v, "manual"); setManual(""); } else toast.error("Enter a value between -430 and 9000."); }} disabled={!manual || loadingAi}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          {last && last.value >= 2500 && (
            <p className="mt-4 rounded-lg border border-pulse/30 bg-pulse/5 p-3 text-sm text-pulse">
              You're above 2500 m — ascend slowly, hydrate, and watch for headache, nausea or breathlessness.
            </p>
          )}
        </section>
      </div>

      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No data yet. Enable a data source below or log manually.
        </p>
      )}

      <TrendCard title="7-day altitude trend" entries={entries} unit="m" accent="primary" dataSource="Phone barometer / GPS altitude + manual entries (stored on this device)" />

      {(loadingAi || result) && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">AI insight</h2>
          {loadingAi ? (
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm">Assessing altitude & breathing…</p>
            </div>
          ) : result ? (
            <div className="mt-5"><AiResultPanel result={result} toolName="AltitudeGuide" /></div>
          ) : null}
        </section>
      )}
    </ModuleLayout>
  );
}
