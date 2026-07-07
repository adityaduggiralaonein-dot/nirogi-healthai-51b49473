import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/hearing-health")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/hearing" });
  },
});
