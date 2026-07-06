import { createFileRoute } from "@tanstack/react-router";
import { Bone } from "lucide-react";
import { SimpleTracker } from "@/components/dashboard/SimpleTracker";
import { moduleDisclaimer } from "@/components/dashboard/ModuleLayout";

export const Route = createFileRoute("/_authenticated/dashboard/bone-health")({
  head: () => ({ meta: [{ title: "Bone & Joint Health · Nirogi" }] }),
  component: BoneHealthPage,
});

const disclaimer = moduleDisclaimer({
  name: "BoneHealth",
  disclaimer:
    "BoneHealth is an educational bone and joint screening aid, not a diagnosis. Only a doctor and tests like a DEXA scan or X-ray can confirm osteoporosis or arthritis.",
  redFlags: [
    "Sudden severe joint pain, swelling, redness and fever",
    "Inability to bear weight after a fall (possible fracture)",
    "Back pain with numbness, weakness or loss of bladder control",
  ],
  emergency: "A suspected fracture or back pain with numbness/weakness needs urgent care — go to the nearest emergency room.",
});

function BoneHealthPage() {
  return (
    <SimpleTracker
      module="bone-health"
      icon={Bone}
      accent="success"
      title="Bone & Joint Health"
      subtitle="Log a daily pain/stiffness score (0 = none, 10 = severe)"
      unit="/10 pain"
      aiTool="bonehealth"
      aiName="BoneHealth"
      disclaimer={disclaimer}
      manualPlaceholder="0–10"
      min={0}
      max={10}
      bands={[
        { max: 2, label: "Minimal", tone: "success" },
        { max: 5, label: "Mild–moderate", tone: "warning" },
        { max: 7, label: "Significant", tone: "pulse" },
        { max: 10, label: "Severe", tone: "destructive" },
      ]}
      noteLabel="Which joints, stiffness, activity, calcium/vitamin D? — used for the AI note"
    />
  );
}
