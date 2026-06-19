import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Dumbbell, Moon, ArrowRight } from "lucide-react";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { getWaterToday, getExercise, getSleep, getWellnessSettings } from "@/lib/wellness.functions";

export function WellnessTrackers() {
  const { t } = useI18n();
  const { memberId } = useActiveMember();
  const fnWater = useServerFn(getWaterToday);
  const fnEx = useServerFn(getExercise);
  const fnSleep = useServerFn(getSleep);
  const fnSettings = useServerFn(getWellnessSettings);

  const { data: water } = useQuery({ queryKey: ["water", memberId], queryFn: () => fnWater({ data: { memberId } }) });
  const { data: ex } = useQuery({ queryKey: ["exercise", memberId], queryFn: () => fnEx({ data: { memberId } }) });
  const { data: sleep } = useQuery({ queryKey: ["sleep", memberId], queryFn: () => fnSleep({ data: { memberId } }) });
  const { data: settings } = useQuery({ queryKey: ["wellness-settings", memberId], queryFn: () => fnSettings({ data: { memberId } }) });

  const goal = settings?.settings?.water_goal_ml ?? 3000;
  const waterPct = Math.min(100, Math.round(((water?.todayTotal ?? 0) / goal) * 100));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">{t("dash.wellness", "Wellness trackers")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TrackerCard
          to="/water-tracker"
          icon={<Droplets className="size-5" />}
          accent="bg-primary/10 text-primary"
          title={t("water.title", "Water")}
          value={`${((water?.todayTotal ?? 0) / 1000).toFixed(1)}L`}
          sub={`${waterPct}% ${t("water.of_goal", "of goal")}`}
        />
        <TrackerCard
          to="/exercise-tracker"
          icon={<Dumbbell className="size-5" />}
          accent="bg-pulse/10 text-pulse"
          title={t("exercise.title", "Exercise")}
          value={`${ex?.weekMinutes ?? 0} min`}
          sub={t("exercise.this_week", "This week")}
        />
        <TrackerCard
          to="/sleep-tracker"
          icon={<Moon className="size-5" />}
          accent="bg-primary/10 text-primary"
          title={t("sleep.title", "Sleep")}
          value={sleep?.avgDuration ? `${Math.floor(sleep.avgDuration / 60)}h ${sleep.avgDuration % 60}m` : "—"}
          sub={t("sleep.avg", "Avg / night")}
        />
      </div>
    </section>
  );
}

function TrackerCard({
  to, icon, accent, title, value, sub,
}: {
  to: string; icon: React.ReactNode; accent: string; title: string; value: string; sub: string;
}) {
  return (
    <Link to={to} className="group rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <span className={`flex size-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-3 font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{title} · {sub}</p>
    </Link>
  );
}
