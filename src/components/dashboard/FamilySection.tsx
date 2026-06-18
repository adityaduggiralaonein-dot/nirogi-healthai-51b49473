import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Users, Trash2, Pencil, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "@/lib/family.functions";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type MemberRow = {
  id: string;
  full_name: string;
  relation: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  health_conditions: string | null;
  current_medicines: string | null;
  allergies: string | null;
};

type FormState = {
  full_name: string;
  relation: string;
  age: string;
  gender: string;
  blood_group: string;
  weight_kg: string;
  height_cm: string;
  health_conditions: string;
  current_medicines: string;
  allergies: string;
};

const empty: FormState = {
  full_name: "", relation: "", age: "", gender: "", blood_group: "",
  weight_kg: "", height_cm: "", health_conditions: "", current_medicines: "", allergies: "",
};

export function FamilySection() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { memberId, setMember } = useActiveMember();

  const listFn = useServerFn(listFamilyMembers);
  const addFn = useServerFn(addFamilyMember);
  const updFn = useServerFn(updateFamilyMember);
  const delFn = useServerFn(deleteFamilyMember);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => listFn(),
  });
  const members = (data?.members ?? []) as MemberRow[];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["family-members"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        relation: form.relation || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        health_conditions: form.health_conditions || null,
        current_medicines: form.current_medicines || null,
        allergies: form.allergies || null,
      };
      if (editId) return updFn({ data: { id: editId, ...payload } });
      return addFn({ data: payload });
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm(empty);
      setEditId(null);
      toast.success(editId ? "Member updated." : "Member added.");
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("LIMIT_REACHED")) toast.error("You can add up to 6 family members.");
      else toast.error("Couldn't save member. Please try again.");
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: (_d, id) => {
      if (memberId === id) setMember(null, null);
      invalidate();
      toast.success("Member removed.");
    },
    onError: () => toast.error("Couldn't remove member."),
  });

  const startAdd = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };

  const startEdit = (m: MemberRow) => {
    setEditId(m.id);
    setForm({
      full_name: m.full_name ?? "",
      relation: m.relation ?? "",
      age: m.age?.toString() ?? "",
      gender: m.gender ?? "",
      blood_group: m.blood_group ?? "",
      weight_kg: m.weight_kg?.toString() ?? "",
      height_cm: m.height_cm?.toString() ?? "",
      health_conditions: m.health_conditions ?? "",
      current_medicines: m.current_medicines ?? "",
      allergies: m.allergies ?? "",
    });
    setOpen(true);
  };

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Users className="size-5 text-primary" /> {t("dash.family", "Family")}
        </h2>
        <Button size="sm" variant="outline" onClick={startAdd}>
          <Plus className="size-4" /> {t("dash.add_member", "Add member")}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("dash.family_note", "Switch profiles to run tools for a family member.")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setMember(null, null)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            memberId === null ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
          )}
        >
          <User className="size-3.5" /> {t("dash.you", "You")}
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setMember(m.id, m.full_name)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              memberId === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {m.full_name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 flex justify-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : members.length > 0 ? (
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="text-sm">
                <span className="font-medium">{m.full_name}</span>
                <span className="text-muted-foreground">
                  {m.relation ? ` · ${m.relation}` : ""}{m.age ? ` · ${m.age}y` : ""}{m.blood_group ? ` · ${m.blood_group}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(m)}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => delMut.mutate(m.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t("dash.edit_member", "Edit member") : t("dash.add_member", "Add member")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("dash.full_name", "Full name")}><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
            <Field label={t("dash.relation", "Relation")}><Input value={form.relation} onChange={(e) => set("relation", e.target.value)} placeholder="e.g. Mother" /></Field>
            <Field label={t("dash.age", "Age")}><Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
            <Field label={t("dash.gender", "Gender")}><Input value={form.gender} onChange={(e) => set("gender", e.target.value)} /></Field>
            <Field label={t("dash.blood_group", "Blood group")}><Input value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} /></Field>
            <Field label={t("dash.weight", "Weight (kg)")}><Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
            <Field label={t("dash.height", "Height (cm)")}><Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label={t("dash.conditions", "Health conditions")}><Textarea rows={2} value={form.health_conditions} onChange={(e) => set("health_conditions", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label={t("dash.medicines", "Current medicines")}><Textarea rows={2} value={form.current_medicines} onChange={(e) => set("current_medicines", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label={t("dash.allergies", "Allergies")}><Textarea rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} /></Field></div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveMut.mutate()} disabled={!form.full_name.trim() || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
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
