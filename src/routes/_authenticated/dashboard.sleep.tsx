import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/sleep")({
  beforeLoad: () => {
    throw redirect({ to: "/sleep-tracker" });
  },
});
