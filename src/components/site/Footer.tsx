import { Link } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import logo from "@/assets/nirogi-logo.png";

function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Nirogi logo" width={32} height={32} className="h-8 w-8" loading="lazy" />
              <span className="font-display text-lg font-bold">Nirogi</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Free, AI-powered preventive healthcare for everyone. Catch it before it's too late.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">AI Tools</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/tools/$tool" params={{ tool: "medguard" }} className="hover:text-foreground">MedGuard</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "cancersense" }} className="hover:text-foreground">CancerSense</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "sensecheck" }} className="hover:text-foreground">SenseCheck</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "calorieeye" }} className="hover:text-foreground">CalorieEye</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "skinscan" }} className="hover:text-foreground">SkinScan</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "medverify" }} className="hover:text-foreground">MedVerify</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "sugarsense" }} className="hover:text-foreground">SugarSense</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "heartsense" }} className="hover:text-foreground">HeartSense</Link></li>
              <li><Link to="/tools/$tool" params={{ tool: "scaniq" }} className="hover:text-foreground">ScanIQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/#sources" className="hover:text-foreground">Data sources</a></li>
              <li><a href="/#updates" className="hover:text-foreground">Latest updates</a></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
              <li>
                <button onClick={openCookieSettings} className="hover:text-foreground">
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Built for the hackathon</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Made for India · Track 2 · powered by
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold tracking-tight shadow-sm">
                <span className="text-pulse">red</span>rob
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold tracking-tight shadow-sm">
                <HeartPulse className="size-4 text-primary" />
                hack2skills
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nirogi. For education only — not a substitute for professional medical care.</p>
          <p>Made with care for the Redrob × Hack2skills hackathon.</p>
        </div>
      </div>
    </footer>
  );
}
