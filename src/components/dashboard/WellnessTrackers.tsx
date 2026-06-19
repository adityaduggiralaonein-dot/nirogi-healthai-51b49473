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
  const cardBase = "group rounded-xl border border-border p-4 transition-colors hover:bg-muted/50";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">{t("dash.wellness", "Wellness trackers")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/water-tracker" className={cardBase}>
          <Head accent="bg-primary/10 text-primary" icon={<Droplets className="size-5" />} />
          <p className="mt-3 font-display text-xl font-bold">{((water?.todayTotal ?? 0) / 1000).toFixed(1)}L</p>
          <p className="text-xs text-muted-foreground">{t("water.title", "Water")} · {waterPct}% {t("water.of_goal", "of goal")}</p>
        </Link>

        <Link to="/exercise-tracker" className={cardBase}>
          <Head accent="bg-pulse/10 text-pulse" icon={<Dumbbell className="size-5" />} />
          <p className="mt-3 font-display text-xl font-bold">{ex?.weekMinutes ?? 0} min</p>
          <p className="text-xs text-muted-foreground">{t("exercise.title", "Exercise")} · {t("exercise.this_week", "This week")}</p>
        </Link>

        <Link to="/sleep-tracker" className={cardBase}>
          <Head accent="bg-primary/10 text-primary" icon={<Moon className="size-5" />} />
          <p className="mt-3 font-display text-xl font-bold">
            {sleep?.avgDuration ? `${Math.floor(sleep.avgDuration / 60)}h ${sleep.avgDuration % 60}m` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{t("sleep.title", "Sleep")} · {t("sleep.avg", "Avg / night")}</p>
        </Link>
      </div>
    </section>
  );
}

function Head({ accent, icon }: { accent: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`flex size-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
