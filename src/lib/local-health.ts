// Lightweight per-user localStorage store for the sensor / manual dashboard
// modules that don't need a database table. Each module keeps a rolling list
// of dated entries; helpers derive "latest" and a 7-day series for charts.

export type ModuleEntry = { t: string; value: number; note?: string; source?: string };

const PREFIX = "nirogi_";

function key(module: string) {
  return `${PREFIX}${module}_logs`;
}

export function loadEntries(module: string): ModuleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(module));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ModuleEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendEntry(module: string, entry: Omit<ModuleEntry, "t"> & { t?: string }): ModuleEntry[] {
  const list = loadEntries(module);
  const full: ModuleEntry = { t: entry.t ?? new Date().toISOString(), value: entry.value, note: entry.note, source: entry.source };
  const next = [...list, full].slice(-200);
  try {
    window.localStorage.setItem(key(module), JSON.stringify(next));
  } catch {
    /* storage full / unavailable */
  }
  return next;
}

export function latestEntry(module: string): ModuleEntry | null {
  const list = loadEntries(module);
  return list.length ? list[list.length - 1] : null;
}

/** Last 7 calendar days, averaged per day, for a trend chart. Empty days omitted. */
export function weekSeries(entries: ModuleEntry[]): { date: string; value: number }[] {
  const byDay = new Map<string, { sum: number; n: number; ts: number }>();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  for (const e of entries) {
    const ts = new Date(e.t).getTime();
    if (isNaN(ts) || ts < weekAgo) continue;
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const cur = byDay.get(label) ?? { sum: 0, n: 0, ts: d.getTime() };
    cur.sum += e.value;
    cur.n += 1;
    byDay.set(label, cur);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[1].ts - b[1].ts)
    .map(([date, v]) => ({ date, value: Math.round((v.sum / v.n) * 10) / 10 }));
}
