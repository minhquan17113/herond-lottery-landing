"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Holographic-foil physics for the closing ticket. The wrapper tilts toward
 * the pointer like a card held in the hand (spring-damped, max ~5deg) and
 * publishes the pointer position as --fx/--fy custom properties so FoilSheen
 * layers inside can run an iridescent light across the foil. All driven by
 * motion values outside the React render cycle; inert on touch-only devices
 * and under reduced motion.
 */
export function FoilTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);
  const spring = { stiffness: 120, damping: 18, mass: 0.6 };
  const sx = useSpring(nx, spring);
  const sy = useSpring(ny, spring);

  const rotateX = useTransform(sy, [0, 1], [4.5, -4.5]);
  const rotateY = useTransform(sx, [0, 1], [-5.5, 5.5]);
  const fx = useMotionTemplate`${useTransform(sx, (v) => v * 100)}%`;
  const fy = useMotionTemplate`${useTransform(sy, (v) => v * 100)}%`;

  const canTilt = () =>
    !reduce && typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const onPointerMove = (e: React.PointerEvent) => {
    if (!canTilt() || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    nx.set((e.clientX - rect.left) / rect.width);
    ny.set((e.clientY - rect.top) / rect.height);
  };

  const onPointerLeave = () => {
    nx.set(0.5);
    ny.set(0.5);
  };

  return (
    <div style={{ perspective: "1200px" }} className={cn(className)}>
      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={
          reduce
            ? undefined
            : ({ rotateX, rotateY, "--fx": fx, "--fy": fy, transformStyle: "preserve-3d" } as never)
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Iridescent light pass inside a FoilTilt. A white catch-light follows the
 * pointer; a wider brand-hue band (blue/purple/pink, the aurora trio) drifts
 * with it at lower opacity, reading as foil rather than paint. Sits inert at
 * center when the pointer is elsewhere.
 */
export function FoilSheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-300"
      style={{
        background: [
          "radial-gradient(300px circle at var(--fx, 50%) var(--fy, 50%), rgba(255,255,255,0.13), transparent 62%)",
          "radial-gradient(560px circle at calc(var(--fx, 50%) + 12%) calc(var(--fy, 50%) - 10%), rgba(51,115,246,0.16), transparent 65%)",
          "radial-gradient(480px circle at calc(var(--fx, 50%) - 14%) calc(var(--fy, 50%) + 12%), rgba(255,128,151,0.10), transparent 60%)",
          "radial-gradient(520px circle at calc(var(--fx, 50%) + 4%) calc(var(--fy, 50%) + 18%), rgba(102,81,234,0.12), transparent 62%)",
        ].join(", "),
      }}
    />
  );
}
