import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Target, TrendingUp, Plus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getHealthGoal, saveHealthGoal, logWeight } from "@/lib/goals.functions";
import { useActiveMember } from "@/lib/active-member";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Health Goals · Nirogi" }] }),
  component: GoalsPage,
});

const GOAL_TYPES: { value: "lose" | "gain" | "muscle" | "maintain" | "height"; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "gain", label: "Gain weight" },
  { value: "muscle", label: "Build muscle" },
  { value: "maintain", label: "Maintain" },
  { value: "height", label: "Grow taller (teens)" },
];

function GoalsPage() {
  const { memberId, memberName } = useActiveMember();
  const qc = useQueryClient();
  const getGoal = useServerFn(getHealthGoal);
  const saveGoal = useServerFn(saveHealthGoal);
  const addWeight = useServerFn(logWeight);

  const { data, isLoading } = useQuery({
    queryKey: ["health-goal", memberId],
    queryFn: () => getGoal({ data: { memberId } }),
  });

  const [goalType, setGoalType] = useState<(typeof GOAL_TYPES)[number]["value"]>("lose");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [months, setMonths] = useState("3");
  const [saving, setSaving] = useState(false);

  const [newWeight, setNewWeight] = useState("");
  const [logging, setLogging] = useState(false);

  const goal = data?.goal;
  const logs = data?.weightLogs ?? [];

  useEffect(() => {
    if (goal) {
      setGoalType(goal.goal_type);
      setWeight(String(goal.current_weight_kg ?? ""));
      setHeight(String(goal.current_height_cm ?? ""));
      setTargetWeight(goal.target_weight_kg ? String(goal.target_weight_kg) : "");
      setMonths(String(goal.timeline_months ?? 3));
    }
  }, [goal]);

  const chart = useMemo(
    () =>
      logs.map((l) => ({
        date: new Date(l.logged_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        weight: l.weight_kg,
      })),
    [logs],
  );

  const save = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) {
      toast.error("Enter your current weight and height.");
      return;
    }
    setSaving(true);
    try {
      await saveGoal({
        data: {
          memberId,
          goal_type: goalType,
          current_weight_kg: w,
          current_height_cm: h,
          target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
          timeline_months: parseInt(months) || 3,
        },
      });
      toast.success("Goal saved. Your daily targets are ready.");
      qc.invalidateQueries({ queryKey: ["health-goal", memberId] });
    } catch (e) {
      toastServerError(e);
    } finally {
      setSaving(false);
    }
  };

  const log = async () => {
    const w = parseFloat(newWeight);
    if (!w) return;
    setLogging(true);
    try {
      await addWeight({ data: { memberId, weight_kg: w } });
      setNewWeight("");
      toast.success("Weight logged.");
      qc.invalidateQueries({ queryKey: ["health-goal", memberId] });
    } catch (e) {
      toastServerError(e);
    } finally {
      setLogging(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Back />
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Health Goals</h1>
            <p className="text-sm text-muted-foreground">
              {memberName ? `For ${memberName}` : "AI sets your daily calorie & protein targets"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Set your goal</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GOAL_TYPES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoalType(g.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      goalType === g.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Current weight (kg)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5">Height (cm)</Label>
                  <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5">Target weight (kg)</Label>
                  <Input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="optional" />
                </div>
                <div>
                  <Label className="mb-1.5">Timeline (months)</Label>
                  <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} />
                </div>
              </div>
              <Button onClick={save} disabled={saving} className="mt-5 w-full">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
                {saving ? "Saving…" : "Save goal & compute targets"}
              </Button>
            </section>

            <div className="space-y-6">
              {goal && (
                <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
                  <p className="text-sm opacity-90">Your daily targets</p>
                  <div className="mt-3 flex items-end gap-6">
                    <div>
                      <div className="font-display text-4xl font-extrabold">{goal.daily_calorie_target ?? "—"}</div>
                      <p className="text-xs opacity-90">kcal / day</p>
                    </div>
                    <div>
                      <div className="font-display text-4xl font-extrabold">{goal.protein_target_g ?? "—"}g</div>
                      <p className="text-xs opacity-90">protein / day</p>
                    </div>
                  </div>
                  <Link to="/diet-plan" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">
                    Generate a matching diet plan →
                  </Link>
                </section>
              )}

              <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <TrendingUp className="size-5 text-primary" /> Weight trend
                </h2>
                <div className="mt-3 flex gap-2">
                  <Input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Log today's weight (kg)" />
                  <Button onClick={log} disabled={logging || !newWeight}>
                    {logging ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  </Button>
                </div>
                {chart.length > 1 ? (
                  <div className="mt-4 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                        <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Log your weight over a few days to see your trend line.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Back() {
  return (
    <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back to dashboard
    </Link>
  );
}
