import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import logo from "@/assets/nirogi-logo.png";

/**
 * Branded launch splash. Shows once per browser session with a Framer Motion
 * heartbeat reveal, then fades out. Client-only (guards against SSR).
 */
export function IntroSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("nirogi_splash_shown")) return;
    sessionStorage.setItem("nirogi_splash_shown", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060B18]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            src={logo}
            alt="Nirogi"
            className="h-28 w-28 rounded-3xl shadow-elegant"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.7, 1.08, 1, 1.06, 1], opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <motion.p
            className="mt-5 font-display text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Nirogi
          </motion.p>
          <motion.p
            className="mt-1 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Free AI healthcare for everyone
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
