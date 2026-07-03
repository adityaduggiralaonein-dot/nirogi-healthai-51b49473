import { toast } from "sonner";

/** Maps common server-function error messages to friendly toasts. */
export function toastServerError(err: unknown, fallback = "Something went wrong. Please try again.") {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("RATE_LIMIT")) toast.error("Too many requests right now. Please try again shortly.");
  else if (msg.includes("CREDITS_EXHAUSTED")) toast.error("AI usage limit reached. Please try again later.");
  else if (msg.includes("AI is not configured")) toast.error("AI isn't configured yet. Please contact support.");
  else if (msg.includes("LIMIT_REACHED")) toast.error("You've reached the family member limit (6).");
  else if (msg.includes("NO_INPUT")) toast.error("Please add some text or a file first.");
  else toast.error(fallback);
}
