import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { SimpleTracker } from "@/components/dashboard/SimpleTracker";
import { moduleDisclaimer } from "@/components/dashboard/ModuleLayout";

export const Route = createFileRoute("/_authenticated/dashboard/weight")({
  head: () => ({ meta: [{ title: "Weight & BMI · Nirogi" }] }),
  component: WeightPage,
});

const disclaimer = moduleDisclaimer({
  name: "WeightTrack",
  disclaimer:
    "Weight and BMI are general wellness indicators only. BMI does not account for muscle mass or body composition. For weight or metabolic concerns, consult a doctor or dietitian.",
  redFlags: [
    "Rapid unexplained weight loss or gain",
    "Weight loss with fatigue, night sweats or loss of appetite",
    "Sudden swelling with weight gain (possible fluid retention)",
  ],
  emergency: "Sudden swelling with breathlessness needs urgent care — call 112 / 108.",
});

function WeightPage() {
  return (
    <SimpleTracker
      module="weight"
      icon={Scale}
      accent="primary"
      title="Weight & BMI"
      subtitle="Log your weight to track trends and BMI"
      unit="kg"
      step={0.1}
      aiTool="weighttrack"
      aiName="WeightTrack"
      disclaimer={disclaimer}
      manualPlaceholder="e.g. 68.5"
      min={20}
      max={400}
      noteLabel="Goal weight or context? — used for the AI note"
      dataSource="Manual entry / connected scale (stored on this device)"
    />
  );
}
