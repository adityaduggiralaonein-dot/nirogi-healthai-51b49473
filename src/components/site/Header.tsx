import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogIn, LayoutDashboard, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { TOOLS } from "@/lib/tools";
import logo from "@/assets/nirogi-logo.png";
import { cn } from "@/lib/utils";

export function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = [
    { label: "Tools", href: "/#tools" },
    { label: "How it works", href: "/#how" },
    { label: "Updates", href: "/#updates" },
    { label: "Data sources", href: "/#sources" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Nirogi logo" width={48} height={48} className="h-12 w-12 animate-heartbeat" />
          <span className="font-display text-xl font-bold tracking-tight">Nirogi</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">
                <LogIn className="size-4" /> Sign in
              </Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 bg-background md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {n.label}
            </a>
          ))}
          <Button asChild size="sm" className="mt-2">
            <Link to={user ? "/dashboard" : "/auth"} onClick={() => setOpen(false)}>
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export const TOOL_COUNT = TOOLS.length;
