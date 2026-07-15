"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Rolls a number up from 0 the first time it scrolls into view. Renders the
 * final value in markup (SSR + reduced-motion get the real number instantly);
 * GSAP only takes over on capable clients.
 */
export function CountUp({ value, prefix = "", suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`;

  useGSAP(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const counter = { n: 0 };
    gsap.to(counter, {
      n: value,
      duration: 1.3,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onStart: () => {
        el.textContent = format(0);
      },
      onUpdate: () => {
        el.textContent = format(counter.n);
      },
    });
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
