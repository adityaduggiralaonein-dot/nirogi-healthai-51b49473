import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-mesh">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-4 text-primary" />
          Six AI tools · free preventive healthcare for everyone
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-7 font-display text-sm font-semibold uppercase tracking-[0.25em] text-pulse"
        >
          Your body warns you early — start listening
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
        >
          Catch it before <span className="text-gradient-primary">it's too late</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Nirogi turns powerful medical AI into six simple tools — check your medicines, scan your skin,
          read your meals, assess cancer risk and more. Health that doesn't wait for you to fall sick.
        </motion.p>

        {/* Animated ECG heart-pulse */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative mx-auto mt-10 max-w-2xl"
        >
          <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-elegant backdrop-blur-xl">
            <svg
              viewBox="0 0 600 120"
              className="h-24 w-full"
              fill="none"
              role="img"
              aria-label="Animated heartbeat line"
            >
              <line x1="0" y1="60" x2="600" y2="60" stroke="var(--border)" strokeWidth="1" />
              <path
                className="ecg-line"
                d="M0,60 L120,60 L150,60 L165,20 L185,100 L205,60 L235,60 L255,42 L275,78 L300,60 L420,60 L450,60 L465,15 L485,105 L505,60 L600,60"
                stroke="var(--pulse)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg">
            <Link to="/auth">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#tools">Explore the tools</a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ShieldCheck className="size-4 text-success" />
          Private by design · your health data stays yours
        </motion.div>
      </div>
    </section>
  );
}
