import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nirogi-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);

    const open = () => setVisible(true);
    window.addEventListener("open-cookie-settings", open);
    return () => window.removeEventListener("open-cookie-settings", open);
  }, []);

  const choose = (value: "all" | "essential") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-5 shadow-elegant backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-accent p-2 text-accent-foreground">
            <Cookie className="size-5" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold">We value your privacy</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We use essential cookies to keep Nirogi secure and working. With your consent we also use
              cookies to understand how the site is used so we can improve it. Your health data is always
              kept private to your account.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => choose("all")}>
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={() => choose("essential")}>
                Essential only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
