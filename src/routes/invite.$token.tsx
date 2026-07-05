import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HeartPulse, Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { getInviteInfo, acceptFamilyInvite } from "@/lib/family-invite.functions";
import { toast } from "sonner";
import logo from "@/assets/nirogi-logo.png";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "Family invite · Nirogi" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const getInfo = useServerFn(getInviteInfo);
  const accept = useServerFn(acceptFamilyInvite);

  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["invite-info", token],
    queryFn: () => getInfo({ data: { token } }),
  });

  const invite = data?.invite;

  const doAccept = async () => {
    setBusy(true);
    try {
      const res = await accept({ data: { token } });
      setAccepted(res.ownerName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("SELF_INVITE")) setError("This is your own invite link.");
      else if (msg.includes("REVOKED")) setError("This invite has been revoked.");
      else if (msg.includes("ALREADY_USED")) setError("This invite has already been used by someone else.");
      else if (msg.includes("INVALID_INVITE")) setError("This invite link is invalid.");
      else setError("Couldn't accept the invite. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Once signed in and a valid pending invite exists, accept automatically.
  useEffect(() => {
    if (!loading && user && invite && invite.status !== "revoked" && !accepted && !error && !busy) {
      doAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, invite]);

  const signIn = async () => {
    setBusy(true);
    try {
      sessionStorage.setItem("nirogi_pending_invite", token);
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/invite/${token}` });
      if (result?.error) { toast.error("Sign-in failed. Please try again."); setBusy(false); }
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-mesh px-4">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center shadow-elegant backdrop-blur-xl"
      >
        <img src={logo} alt="Nirogi" width={56} height={56} className="mx-auto h-14 w-14" />

        {isLoading || loading ? (
          <div className="mt-8 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : !invite ? (
          <>
            <XCircle className="mx-auto mt-6 size-10 text-destructive" />
            <h1 className="mt-3 font-display text-xl font-bold">Invite not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This invite link is invalid or has expired.</p>
            <Button asChild className="mt-6 w-full"><Link to="/">Go home</Link></Button>
          </>
        ) : accepted ? (
          <>
            <CheckCircle2 className="mx-auto mt-6 size-10 text-success" />
            <h1 className="mt-3 font-display text-xl font-bold">You're connected!</h1>
            <p className="mt-2 text-sm text-muted-foreground">You've joined {accepted}'s family on Nirogi. Your health data stays private to your own account.</p>
            <Button onClick={() => navigate({ to: "/dashboard" })} className="mt-6 w-full">Go to my dashboard</Button>
          </>
        ) : error ? (
          <>
            <XCircle className="mx-auto mt-6 size-10 text-destructive" />
            <h1 className="mt-3 font-display text-xl font-bold">Couldn't join</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="mt-6 w-full"><Link to="/dashboard">Go to dashboard</Link></Button>
          </>
        ) : (
          <>
            <span className="mx-auto mt-6 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="size-6" /></span>
            <h1 className="mt-4 font-display text-xl font-bold">{data?.ownerName} invited you</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join their family on Nirogi as <span className="font-semibold text-foreground">{invite.label}</span>{invite.relation ? ` (${invite.relation})` : ""}. Sign in with your own Google account — your health data stays private to you.
            </p>
            {user ? (
              <Button onClick={doAccept} disabled={busy} className="mt-6 w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Accept invite
              </Button>
            ) : (
              <Button onClick={signIn} disabled={busy} size="lg" className="mt-6 w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <HeartPulse className="size-4" />} Continue with Google
              </Button>
            )}
            <p className="mt-4 text-xs text-muted-foreground">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
