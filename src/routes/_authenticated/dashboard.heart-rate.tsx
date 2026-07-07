import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/heart-rate")({
  beforeLoad: () => {
    throw redirect({ to: "/heart-rhythm" });
  },
});
