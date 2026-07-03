import { useEffect, useState } from "react";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import icon from "@/assets/nirogi-logo.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nirogi-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

/** Registers the service worker and shows a friendly "install app" banner. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  // Register the service worker once (client only).
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = (() => {
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        return raw ? Date.now() - Number(raw) < 7 * 24 * 60 * 60 * 1000 : false;
      } catch {
        return false;
      }
    })();
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);

    // iOS never fires beforeinstallprompt — show manual instructions after a beat.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) t = setTimeout(() => setVisible(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => undefined);
      setDeferred(null);
      setVisible(false);
      return;
    }
    if (isIos()) setIosHelp(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 sm:pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-elegant backdrop-blur-xl">
        {!iosHelp ? (
          <div className="flex items-start gap-3">
            <img src={icon} alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-display text-sm font-bold">
                <Smartphone className="size-4 text-primary" /> Install Nirogi
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add the app to your home screen for one-tap access, offline basics, and a native feel.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={install} className="h-8">
                  <Download className="size-4" /> Install app
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">
                  Not now
                </Button>
              </div>
            </div>
            <button aria-label="Dismiss" onClick={dismiss} className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold">Add to Home Screen</p>
              <button aria-label="Dismiss" onClick={dismiss} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <ol className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted font-semibold">1</span>
                Tap the <Share className="inline size-3.5" /> Share button in Safari.
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted font-semibold">2</span>
                Choose <Plus className="inline size-3.5" /> “Add to Home Screen”.
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted font-semibold">3</span>
                Tap “Add” — Nirogi appears like a native app.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
