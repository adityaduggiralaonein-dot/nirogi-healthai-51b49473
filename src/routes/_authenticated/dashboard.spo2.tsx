import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/spo2")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/oxygen" });
  },
});
