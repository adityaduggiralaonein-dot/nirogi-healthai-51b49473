import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Always-visible red emergency button, fixed bottom-right on every page. */
export function SosFloatingButton() {
  const { t } = useI18n();
  return (
    <Link
      to="/sos"
      aria-label={t("common.sos", "SOS")}
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-destructive px-4 py-3 text-destructive-foreground shadow-pulse ring-4 ring-destructive/20 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-destructive/40" />
      <Siren className="size-5 animate-heartbeat" />
      <span className="text-sm font-bold tracking-wide">{t("common.sos", "SOS")}</span>
    </Link>
  );
}
