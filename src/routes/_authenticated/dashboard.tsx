import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, LogOut, Upload, FileText, ArrowRight, History } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile, analyzePrescription } from "@/lib/profile.functions";
import { TOOLS } from "@/lib/tools";
import { useI18n } from "@/lib/i18n";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { FamilySection } from "@/components/dashboard/FamilySection";
import { MedicineReminders } from "@/components/dashboard/MedicineReminders";
import { ReportActions } from "@/components/site/ReportActions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard · Nirogi" }] }),
  component: Dashboard,
});

type FormState = {
  full_name: string;
  age: string;
  gender: string;
  blood_group: string;
  weight_kg: string;
  height_cm: string;
  health_conditions: string;
  current_medicines: string;
  family_history: string;
  recent_surgeries: string;
  allergies: string;
};

const empty: FormState = {
  full_name: "", age: "", gender: "", blood_group: "", weight_kg: "", height_cm: "",
  health_conditions: "", current_medicines: "", family_history: "", recent_surgeries: "", allergies: "",
};

function Dashboard() {
  const { signOut } = useAuth();
  const { t, lang } = useI18n();
  const getProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const analyze = useServerFn(analyzePrescription);

  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [prescription, setPrescription] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getProfile(),
  });

  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setForm({
      full_name: p.full_name ?? "",
      age: p.age?.toString() ?? "",
      gender: p.gender ?? "",
      blood_group: p.blood_group ?? "",
      weight_kg: p.weight_kg?.toString() ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      health_conditions: p.health_conditions ?? "",
      current_medicines: p.current_medicines ?? "",
      family_history: p.family_history ?? "",
      recent_surgeries: p.recent_surgeries ?? "",
      allergies: p.allergies ?? "",
    });
    setPrescription(p.prescription_analysis ?? null);
  }, [data]);

  const bmi = useMemo(() => {
    const w = parseFloat(form.weight_kg);
    const h = parseFloat(form.height_cm) / 100;
    if (!w || !h) return null;
    return Math.round((w / (h * h)) * 10) / 10;
  }, [form.weight_kg, form.height_cm]);

  const bmiLabel = bmi == null ? "" : bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile({
        data: {
          full_name: form.full_name || null,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender || null,
          blood_group: form.blood_group || null,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
          health_conditions: form.health_conditions || null,
          current_medicines: form.current_medicines || null,
          family_history: form.family_history || null,
          recent_surgeries: form.recent_surgeries || null,
          allergies: form.allergies || null,
        },
      });
      toast.success("Profile saved.");
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onPrescription = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large (max 8MB).");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setAnalyzing(true);
    try {
      const res = await analyze({ data: { image: dataUrl, lang } });
      setPrescription(res.analysis);
      toast.success("Prescription analyzed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RATE_LIMIT")) toast.error("Too many requests. Try again shortly.");
      else if (msg.includes("CREDITS_EXHAUSTED")) toast.error("AI usage limit reached.");
      else toast.error("Couldn't read the prescription. Try a clearer photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("dash.title", "Your health profile")}</h1>
            <p className="mt-1 text-muted-foreground">{t("dash.subtitle", "Keep this updated — every AI tool reads it to personalize results.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/history">
                <History className="size-4" /> {t("nav.history", "History")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" /> {t("nav.signout", "Sign out")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <HealthScoreCard />
              </div>
              <FamilySection />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-semibold">{t("dash.basics", "Basics")}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label={t("dash.full_name", "Full name")}><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
                    <Field label={t("dash.age", "Age")}><Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
                    <Field label={t("dash.gender", "Gender")}><Input value={form.gender} onChange={(e) => set("gender", e.target.value)} placeholder="e.g. Female" /></Field>
                    <Field label={t("dash.blood_group", "Blood group")}><Input value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} placeholder="e.g. O+" /></Field>
                    <Field label={t("dash.weight", "Weight (kg)")}><Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
                    <Field label={t("dash.height", "Height (cm)")}><Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-semibold">{t("dash.medical_history", "Medical history")}</h2>
                  <div className="mt-4 space-y-4">
                    <Field label={t("dash.conditions", "Health conditions")}><Textarea rows={2} value={form.health_conditions} onChange={(e) => set("health_conditions", e.target.value)} placeholder="e.g. Type 2 diabetes, hypertension" /></Field>
                    <Field label={t("dash.medicines", "Current medicines")}><Textarea rows={2} value={form.current_medicines} onChange={(e) => set("current_medicines", e.target.value)} placeholder="e.g. Metformin 500mg" /></Field>
                    <Field label={t("dash.family_history", "Family history")}><Textarea rows={2} value={form.family_history} onChange={(e) => set("family_history", e.target.value)} placeholder="e.g. Father — heart disease" /></Field>
                    <Field label={t("dash.surgeries", "Recent surgeries")}><Textarea rows={2} value={form.recent_surgeries} onChange={(e) => set("recent_surgeries", e.target.value)} /></Field>
                    <Field label={t("dash.allergies", "Allergies")}><Textarea rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} /></Field>
                  </div>
                  <Button onClick={save} disabled={saving} className="mt-5">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    {saving ? t("dash.saving", "Saving…") : t("dash.save_profile", "Save profile")}
                  </Button>
                </section>

                <MedicineReminders />
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-border bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
                  <p className="text-sm font-medium opacity-90">{t("dash.your_bmi", "Your BMI")}</p>
                  <div className="mt-1 font-display text-5xl font-extrabold">{bmi ?? "—"}</div>
                  <p className="mt-1 text-sm opacity-90">{bmiLabel || t("dash.add_wh", "Add weight & height")}</p>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <FileText className="size-5 text-primary" /> {t("dash.prescription_reader", "Prescription reader")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("dash.prescription_note", "Upload a prescription photo and AI explains it in simple words. Stored privately to you.")}</p>
                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center hover:bg-muted">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPrescription(e.target.files?.[0])} />
                    {analyzing ? <Loader2 className="size-5 animate-spin text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
                    <span className="mt-2 text-sm text-muted-foreground">{analyzing ? t("dash.reading", "Reading…") : t("dash.upload_prescription", "Upload prescription")}</span>
                  </label>
                  {prescription && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground/80">
                        {prescription}
                      </motion.div>
                      <div className="mt-3">
                        <ReportActions source={{ toolName: "Prescription reading", text: prescription }} />
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-semibold">{t("dash.jump_tool", "Jump into a tool")}</h2>
                  <div className="mt-3 space-y-2">
                    {TOOLS.map((tl) => (
                      <Link key={tl.slug} to="/tools/$tool" params={{ tool: tl.slug }} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                        <span className="inline-flex items-center gap-2"><tl.icon className="size-4 text-primary" /> {tl.name}</span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}
