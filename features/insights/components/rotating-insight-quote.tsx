"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { RotatingQuote } from "../contracts";

const ROTATION_INTERVAL_MS = 8_000;

export function RotatingInsightQuote({ quotes }: { quotes: RotatingQuote[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const activeQuote = quotes[activeIndex] ?? quotes[0];

  useEffect(() => {
    if (reducedMotion || quotes.length < 2) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const updateTimer = () => {
      if (timer) clearInterval(timer);
      if (document.visibilityState === "visible") {
        timer = setInterval(() => setActiveIndex((index) => (index + 1) % quotes.length), ROTATION_INTERVAL_MS);
      }
    };

    updateTimer();
    document.addEventListener("visibilitychange", updateTimer);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", updateTimer);
    };
  }, [quotes.length, reducedMotion]);

  if (!activeQuote) return null;

  return (
    <aside className="relative hidden h-[270px] max-w-[220px] pl-3 font-serif text-muted lg:block" aria-live="off">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeQuote.id}
          className="absolute inset-0 flex flex-col justify-center pl-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <blockquote className="text-lg italic leading-8">“{activeQuote.text}”</blockquote>
          <span className="my-4 block w-9 border-t border-line" />
          <p className="text-xs tracking-[.18em]">{activeQuote.attribution}</p>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
