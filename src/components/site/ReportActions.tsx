import { useState } from "react";
import { Copy, Download, Share2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  formatReport,
  whatsappShareUrl,
  downloadReportPdf,
  type ReportSource,
} from "@/lib/report";

export function ReportActions({ source }: { source: ReportSource }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatReport(source));
      setCopied(true);
      toast.success(t("report.copied", "Report copied to clipboard"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadReportPdf(source);
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const whatsapp = () => {
    window.open(whatsappShareUrl(source), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {t("report.copy", "Copy")}
        </Button>
        <Button variant="outline" size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {t("report.download", "Download PDF")}
        </Button>
        <Button
          size="sm"
          onClick={whatsapp}
          className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
        >
          <Share2 className="size-4" />
          {t("report.whatsapp", "Share on WhatsApp")}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {t("report.share_note", "WhatsApp shares the text report. Download the PDF to attach a file.")}
      </p>
    </div>
  );
}
