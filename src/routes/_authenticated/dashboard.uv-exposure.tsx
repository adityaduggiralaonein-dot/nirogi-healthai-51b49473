import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/uv-exposure")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/uv" });
  },
});
