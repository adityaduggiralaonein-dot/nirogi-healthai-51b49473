import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/fitness")({
  beforeLoad: () => {
    throw redirect({ to: "/exercise-tracker" });
  },
});
