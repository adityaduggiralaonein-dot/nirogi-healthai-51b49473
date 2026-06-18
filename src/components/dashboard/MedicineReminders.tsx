import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pill, Trash2, Check, Bell, BellOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listReminders,
  addReminder,
  deleteReminder,
  logDose,
} from "@/lib/medicine.functions";
import { useI18n } from "@/lib/i18n";


type ReminderRow = {
  id: string;
  medicine_name: string;
  dose: string | null;
  timings: string[];
  with_food: string | null;
  duration: string | null;
  tablets_remaining: number | null;
  active: boolean;
};

type LogRow = { reminder_id: string; status: string };

export function MedicineReminders() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const listFn = useServerFn(listReminders);
  const addFn = useServerFn(addReminder);
  const delFn = useServerFn(deleteReminder);
  const logFn = useServerFn(logDose);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [timings, setTimings] = useState("");
  const [withFood, setWithFood] = useState("");
  const [tablets, setTablets] = useState("");
  const [notify, setNotify] = useState(false);
  const firedRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["medicine-reminders"],
    queryFn: () => listFn(),
  });
  const reminders = (data?.reminders ?? []) as ReminderRow[];
  const todayLogs = (data?.todayLogs ?? []) as LogRow[];

  const takenToday = (id: string) => todayLogs.some((l) => l.reminder_id === id && l.status === "taken");

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotify(true);
  }, []);

  // Browser notification scheduler — checks every 30s while the page is open.
  useEffect(() => {
    if (!notify || reminders.length === 0) return;
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const r of reminders) {
        if (!r.active) continue;
        if (r.timings?.includes(hhmm)) {
          const key = `${r.id}-${hhmm}-${now.toDateString()}`;
          if (firedRef.current.has(key)) continue;
          firedRef.current.add(key);
          if (Notification.permission === "granted") {
            new Notification("Nirogi · Medicine reminder", {
              body: `Time to take ${r.medicine_name}${r.dose ? ` (${r.dose})` : ""}.`,
            });
          }
          toast.info(`Time to take ${r.medicine_name}`);
        }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [notify, reminders]);

  const enableNotify = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Notifications aren't supported in this browser.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotify(true);
      toast.success("Reminders enabled while Nirogi is open.");
    } else {
      toast.error("Notifications were blocked.");
    }
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["medicine-reminders"] });
    qc.invalidateQueries({ queryKey: ["health-score"] });
  };

  const addMut = useMutation({
    mutationFn: () =>
      addFn({
        data: {
          medicine_name: name.trim(),
          dose: dose || null,
          timings: timings.split(",").map((x) => x.trim()).filter(Boolean),
          with_food: withFood || null,
          tablets_remaining: tablets ? parseInt(tablets) : null,
        },
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setName(""); setDose(""); setTimings(""); setWithFood(""); setTablets("");
      toast.success("Reminder added.");
    },
    onError: () => toast.error("Couldn't add reminder."),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Reminder removed."); },
    onError: () => toast.error("Couldn't remove reminder."),
  });

  const takeMut = useMutation({
    mutationFn: (id: string) => logFn({ data: { reminder_id: id, status: "taken" } }),
    onSuccess: () => { invalidate(); toast.success("Marked as taken."); },
    onError: () => toast.error("Couldn't update."),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Pill className="size-5 text-primary" /> {t("dash.reminders", "Medicine Reminders")}
        </h2>
        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost" className="size-8" onClick={enableNotify} title="Enable notifications">
            {notify ? <Bell className="size-4 text-primary" /> : <BellOff className="size-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> {t("common.add", "Add")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex justify-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : reminders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("dash.no_reminders", "No reminders yet. Add your medicines to get timely nudges.")}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {reminders.map((r) => {
            const taken = takenToday(r.id);
            const lowStock = r.tablets_remaining != null && r.tablets_remaining <= 5;
            return (
              <div key={r.id} className="rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.medicine_name}
                      {r.dose ? <span className="text-muted-foreground"> · {r.dose}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.timings?.length ? r.timings.join(", ") : "No times set"}
                      {r.with_food ? ` · ${r.with_food}` : ""}
                      {r.tablets_remaining != null ? ` · ${r.tablets_remaining} left` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant={taken ? "secondary" : "default"}
                      disabled={taken || takeMut.isPending}
                      onClick={() => takeMut.mutate(r.id)}
                    >
                      <Check className="size-4" /> {taken ? t("dash.taken", "Taken") : t("dash.take", "Take")}
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => delMut.mutate(r.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {lowStock && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                    <AlertTriangle className="size-3" /> {t("dash.refill", "Low stock — time to refill.")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dash.add_reminder", "Add medicine reminder")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">{t("dash.medicine_name", "Medicine name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5">{t("dash.dose", "Dose")}</Label>
                <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg" />
              </div>
              <div>
                <Label className="mb-1.5">{t("dash.tablets_left", "Tablets left")}</Label>
                <Input type="number" value={tablets} onChange={(e) => setTablets(e.target.value)} placeholder="e.g. 30" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">{t("dash.timings", "Times (24h, comma separated)")}</Label>
              <Input value={timings} onChange={(e) => setTimings(e.target.value)} placeholder="e.g. 08:00, 14:00, 21:00" />
            </div>
            <div>
              <Label className="mb-1.5">{t("dash.with_food", "With food?")}</Label>
              <Input value={withFood} onChange={(e) => setWithFood(e.target.value)} placeholder="e.g. After meals" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addMut.mutate()} disabled={!name.trim() || addMut.isPending}>
              {addMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
