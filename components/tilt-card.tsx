"use client";

import { useRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
}

/**
 * Surface card with two quiet responses to the hand: a small spring lift, and
 * a pointer-tracked spotlight (a soft pool of brand-blue light under the
 * cursor). Spotlight coordinates are written straight to CSS variables in the
 * event handler; no React state, no re-renders, nothing runs while idle.
 * Touch and reduced-motion contexts never trigger hover, so they simply get
 * the calm resting card.
 */
export function TiltCard({ children, className, ...props }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group/spot relative rounded-2xl border border-border bg-card transition-colors duration-200 ease-out hover:border-white/15",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(51,115,246,0.10), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
