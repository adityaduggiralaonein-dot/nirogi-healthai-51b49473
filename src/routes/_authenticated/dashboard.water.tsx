import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/water")({
  beforeLoad: () => {
    throw redirect({ to: "/water-tracker" });
  },
});
