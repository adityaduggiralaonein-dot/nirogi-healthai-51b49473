import { createFileRoute } from "@tanstack/react-router";
import { Thermometer } from "lucide-react";
import { SimpleTracker } from "@/components/dashboard/SimpleTracker";
import { moduleDisclaimer } from "@/components/dashboard/ModuleLayout";

export const Route = createFileRoute("/_authenticated/dashboard/temperature")({
  head: () => ({ meta: [{ title: "Body Temperature · Nirogi" }] }),
  component: TemperaturePage,
});

const disclaimer = moduleDisclaimer({
  name: "ThermoCheck",
  disclaimer:
    "ThermoCheck gives general fever guidance only and is not a diagnosis. Always use a real thermometer and see a doctor for persistent or high fever, especially in infants, the elderly or pregnant people.",
  redFlags: [
    "Temperature above 40°C, or fever with a stiff neck, rash, confusion or breathlessness",
    "Fever in a baby under 3 months",
    "Fever lasting more than 3 days",
  ],
  emergency: "A very high fever with confusion, stiff neck or breathing trouble is an emergency — call 112 / 108 now.",
});

function TemperaturePage() {
  return (
    <SimpleTracker
      module="temperature"
      icon={Thermometer}
      accent="pulse"
      title="Body Temperature"
      subtitle="Track your temperature and get fever guidance"
      unit="°C"
      step={0.1}
      aiTool="thermocheck"
      aiName="ThermoCheck"
      disclaimer={disclaimer}
      manualPlaceholder="e.g. 37.2"
      min={34}
      max={43}
      bands={[
        { max: 37.4, label: "Normal", tone: "success" },
        { max: 38, label: "Low-grade fever", tone: "warning" },
        { max: 39, label: "Moderate fever", tone: "pulse" },
        { max: 43, label: "High fever", tone: "destructive" },
      ]}
      noteLabel="Symptoms? (chills, body ache, cough…) — used for the AI note"
    />
  );
}
