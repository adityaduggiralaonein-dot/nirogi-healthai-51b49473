import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UtensilsCrossed, Sparkles, Upload, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getDietPlan, generateDietPlan, uploadDietPlan, setMealCompliance } from "@/lib/diet.functions";
import type { DietPlan } from "@/lib/diet.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { ReportActions } from "@/components/site/ReportActions";

export const Route = createFileRoute("/_authenticated/diet-plan")({
  head: () => ({ meta: [{ title: "AI Diet Plan · Nirogi" }] }),
  component: DietPage,
});

const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

function DietPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const getPlan = useServerFn(getDietPlan);
  const genPlan = useServerFn(generateDietPlan);
  const upPlan = useServerFn(uploadDietPlan);
  const setCompliance = useServerFn(setMealCompliance);

  const { data, isLoading } = useQuery({
    queryKey: ["diet-plan", memberId],
    queryFn: () => getPlan({ data: { memberId } }),
  });

  const [goal, setGoal] = useState("Balanced healthy eating");
  const [pref, setPref] = useState("Vegetarian");
  const [cuisine, setCuisine] = useState("North Indian");
  const [budget, setBudget] = useState("₹200/day");
  const [allergies, setAllergies] = useState("");
  const [busy, setBusy] = useState(false);

  const plan = (data?.plan?.plan ?? null) as DietPlan | null;
  const planId = data?.plan?.id ?? null;
  const compliance = data?.compliance ?? [];
  const eaten = new Set(compliance.filter((c) => c.eaten).map((c) => c.meal_slot));

  const generate = async () => {
    setBusy(true);
    try {
      await genPlan({ data: { memberId, lang, goal, food_preference: pref, cuisine, budget, allergies } });
      toast.success("Your 7-day plan is ready.");
      qc.invalidateQueries({ queryKey: ["diet-plan", memberId] });
    } catch (e) {
      toastServerError(e, "Couldn't generate a plan. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      toast.error("File too large (max 12MB).");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setBusy(true);
    try {
      await upPlan({ data: { memberId, lang, file: dataUrl, fileName: file.name } });
      toast.success("Diet plan imported and structured.");
      qc.invalidateQueries({ queryKey: ["diet-plan", memberId] });
    } catch (e) {
      toastServerError(e, "Couldn't read that file. Try a clearer photo or PDF.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (slot: string) => {
    const now = !eaten.has(slot);
    try {
      await setCompliance({ data: { memberId, planId, meal_slot: slot, eaten: now } });
      qc.invalidateQueries({ queryKey: ["diet-plan", memberId] });
    } catch (e) {
      toastServerError(e);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10 text-success">
            <UtensilsCrossed className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">AI Diet Plan</h1>
            <p className="text-sm text-muted-foreground">Personalised 7-day meals for your body, budget & conditions</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Generate a plan</h2>
            <div className="mt-4 space-y-4">
              <div><Label className="mb-1.5">Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1.5">Food preference</Label><Input value={pref} onChange={(e) => setPref(e.target.value)} /></div>
                <div><Label className="mb-1.5">Cuisine</Label><Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} /></div>
              </div>
              <div><Label className="mb-1.5">Daily budget</Label><Input value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
              <div><Label className="mb-1.5">Allergies / dislikes</Label><Textarea rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="optional" /></div>
            </div>
            <Button onClick={generate} disabled={busy} className="mt-5 w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Working…" : "Generate 7-day plan"}
            </Button>
            <div className="mt-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:bg-muted">
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} disabled={busy} />
                <Upload className="size-4" /> Or upload an existing plan (photo / PDF)
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : plan ? (
              <>
                <h2 className="font-display text-lg font-semibold">{plan.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>

                <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Today's meals — tap when eaten</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggle(s)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                          eaten.has(s) ? "border-success bg-success/10 text-success" : "border-border hover:bg-muted"
                        }`}
                      >
                        {s}
                        {eaten.has(s) && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 max-h-80 space-y-3 overflow-auto pr-1">
                  {plan.days?.map((d, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm font-semibold">{d.day}</p>
                        <span className="text-[11px] text-muted-foreground">{d.calories} kcal · Sugar {d.sugar_load}</span>
                      </div>
                      <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                        <li><b>Breakfast:</b> {d.breakfast}</li>
                        <li><b>Lunch:</b> {d.lunch}</li>
                        <li><b>Dinner:</b> {d.dinner}</li>
                        <li><b>Snack:</b> {d.snack}</li>
                      </ul>
                    </div>
                  ))}
                </div>

                {(plan.tips?.length || plan.warnings?.length) ? (
                  <div className="mt-3 space-y-1 text-xs">
                    {plan.tips?.map((tip, i) => <p key={`t${i}`} className="text-muted-foreground">💡 {tip}</p>)}
                    {plan.warnings?.map((w, i) => <p key={`w${i}`} className="text-warning">⚠ {w}</p>)}
                  </div>
                ) : null}

                <div className="mt-4">
                  <ReportActions source={{ toolName: "AI Diet Plan", text: `${plan.title}\n\n${plan.summary}\n\n${plan.days?.map((d) => `${d.day}: B-${d.breakfast}; L-${d.lunch}; D-${d.dinner}; S-${d.snack} (${d.calories} kcal)`).join("\n")}` }} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UtensilsCrossed className="size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No plan yet. Generate one on the left to get started.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
