import { createFileRoute } from "@tanstack/react-router";
import { Droplet } from "lucide-react";
import { SimpleTracker } from "@/components/dashboard/SimpleTracker";
import { moduleDisclaimer } from "@/components/dashboard/ModuleLayout";

export const Route = createFileRoute("/_authenticated/dashboard/glucose")({
  head: () => ({ meta: [{ title: "Blood Glucose · Nirogi" }] }),
  component: GlucosePage,
});

const disclaimer = moduleDisclaimer({
  name: "GlucoTrack",
  disclaimer:
    "GlucoTrack interprets glucose readings for education only and cannot diagnose diabetes. Only an HbA1c or lab test ordered by a doctor can confirm diabetes. Never change medication or insulin based on this.",
  redFlags: [
    "Fruity breath, deep rapid breathing, vomiting or confusion (possible diabetic ketoacidosis)",
    "Shakiness, sweating, confusion or fainting (possible low blood sugar)",
    "A reading below 54 or above 300 mg/dL",
  ],
  emergency: "A diabetic emergency (very high/low sugar with confusion or fainting) needs urgent care — call 112 / 108 now.",
});

function GlucosePage() {
  return (
    <SimpleTracker
      module="glucose"
      icon={Droplet}
      accent="warning"
      title="Blood Glucose"
      subtitle="Log fasting or post-meal glucose and get instant interpretation"
      unit="mg/dL"
      aiTool="glucotrack"
      aiName="GlucoTrack"
      disclaimer={disclaimer}
      manualPlaceholder="e.g. 95"
      min={30}
      max={600}
      types={[
        { value: "fasting", label: "Fasting" },
        { value: "postmeal", label: "Post-meal" },
        { value: "random", label: "Random" },
      ]}
      bands={[
        { max: 99, label: "Normal (fasting)", tone: "success" },
        { max: 125, label: "Pre-diabetic range", tone: "warning" },
        { max: 600, label: "Diabetic range", tone: "destructive" },
      ]}
      noteLabel="Any symptoms or context? (used for the AI note)"
      dataSource="Manual entry / glucometer (stored on this device)"
    />
  );
}
