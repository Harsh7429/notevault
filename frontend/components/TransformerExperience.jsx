import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { useState } from "react";

import { heroReadout, phaseCopy } from "@/data/transformerData";

export function TransformerExperience({ scrollYProgress, totalFrames }) {
  const [progress, setProgress] = useState(0);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18, 0.3], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -32]);
  const midOpacity = useTransform(scrollYProgress, [0.24, 0.4, 0.72, 0.8], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.3, 0.72], [24, -16]);
  const finalOpacity = useTransform(scrollYProgress, [0.72, 0.82, 1], [0, 1, 1]);
  const finalY = useTransform(scrollYProgress, [0.72, 1], [36, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
  });

  const currentFrame = Math.min(totalFrames, Math.max(1, Math.round(progress * (totalFrames - 1)) + 1));
  const phase = progress < 0.3 ? phaseCopy.presence : progress < 0.75 ? phaseCopy.shift : phaseCopy.arrival;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-y-0 left-6 hidden w-px bg-white/10 lg:block" />
      <div className="absolute inset-y-0 right-6 hidden w-px bg-white/10 lg:block" />

      <motion.div style={{ opacity: heroOpacity, y: heroY }} className="absolute left-6 top-28 max-w-sm lg:left-12 lg:top-36">
        <div className="hud-kicker">{phaseCopy.presence.eyebrow}</div>
        <h1 className="mt-4 max-w-xl font-heading text-5xl uppercase leading-[0.92] tracking-[0.06em] text-white sm:text-7xl">
          {heroReadout.title}
        </h1>
        <p className="mt-5 max-w-md text-lg leading-7 text-white/72">{heroReadout.subtitle}</p>
        <p className="mt-8 text-sm uppercase tracking-[0.35em] text-white/42">{heroReadout.note}</p>
      </motion.div>

      <motion.div style={{ opacity: midOpacity, y: midY }} className="absolute bottom-16 left-6 right-6 lg:left-12 lg:right-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="hud-kicker">{phaseCopy.shift.eyebrow}</div>
            <div className="mt-4 font-heading text-3xl uppercase tracking-[0.18em] text-white sm:text-5xl">{phaseCopy.shift.heading}</div>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/68">{phaseCopy.shift.detail}</p>
          </div>

          <div className="grid min-w-[280px] gap-3 rounded-[1.75rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:grid-cols-2 lg:w-[420px]">
            <div>
              <div className="hud-label">Frame</div>
              <div className="mt-2 font-heading text-2xl text-white">{String(currentFrame).padStart(3, "0")} / {totalFrames}</div>
            </div>
            <div>
              <div className="hud-label">System</div>
              <div className="mt-2 font-heading text-2xl text-[#B71C1C]">SHIFTING</div>
            </div>
            <div>
              <div className="hud-label">Core</div>
              <div className="mt-2 font-heading text-xl text-white/84">ENGAGED</div>
            </div>
            <div>
              <div className="hud-label">Environment</div>
              <div className="mt-2 font-heading text-xl text-white/84">EVOLVING</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div style={{ opacity: finalOpacity, y: finalY }} className="absolute bottom-16 right-6 max-w-lg text-right lg:bottom-20 lg:right-12">
        <div className="hud-kicker">{phaseCopy.arrival.eyebrow}</div>
        <div className="mt-4 font-heading text-4xl uppercase leading-tight tracking-[0.16em] text-white sm:text-6xl">
          {phaseCopy.arrival.heading}
        </div>
        <p className="mt-5 ml-auto max-w-md text-base leading-7 text-white/70">{phaseCopy.arrival.detail}</p>
        <div className="mt-7 text-sm uppercase tracking-[0.38em] text-[#B71C1C]">Directed for NoteVault</div>
      </motion.div>

      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 lg:flex lg:flex-col lg:items-end lg:gap-5">
        <div className="hud-label">Progress</div>
        <div className="h-48 w-px bg-white/10">
          <div className="w-px bg-[#B71C1C] transition-all duration-100" style={{ height: `${Math.max(progress * 100, 2)}%` }} />
        </div>
        <div className="font-heading text-lg text-white">{Math.round(progress * 100)}%</div>
      </div>

      <div className="sr-only" aria-live="polite">
        {phase.eyebrow}. {phase.heading}. {phase.detail}. Frame {currentFrame} of {totalFrames}.
      </div>
    </div>
  );
}
