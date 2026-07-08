import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Stethoscope, ChevronRight } from "lucide-react";
import { DOCTORS } from "@/lib/doctors";
import { cn } from "@/lib/utils";

export function MyDoctors() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Stethoscope className="size-5 text-primary" /> My Doctors
        </h2>
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          Swipe to browse <ChevronRight className="size-3.5" />
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        12 AI specialists — chat by text or speak by voice. Browsing is always free.
      </p>

      <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {DOCTORS.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="snap-start"
            >
              <Link
                to="/doctors/$id"
                params={{ id: d.id }}
                className="flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-border p-4 text-center transition-colors hover:bg-muted/50"
              >
                <span className={cn("flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-card", d.gradient)}>
                  <Icon className="size-8" />
                </span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success" /> Available
                </span>
                <p className="mt-1 font-display text-sm font-bold leading-tight">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.specialty}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
