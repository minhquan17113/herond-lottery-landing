"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Scroll-scrubbed page atmosphere. A fixed, pointer-inert layer behind the
 * content holds one very low-luminance tint scene per section; ScrollTrigger
 * scrubs each scene's opacity as its section crosses the viewport, so the
 * page's lighting travels with the story: blue with a breath of gold at the
 * prize pools, purple through the product walkthrough, pink at the close.
 * Opacity-only tweens on pre-painted gradients; nothing repaints per frame.
 * Under reduced motion the layer stays dark.
 */
const SCENES: { id: string; background: string }[] = [
  {
    id: "rewards",
    background: [
      "radial-gradient(60% 55% at 8% 62%, rgba(51,115,246,0.10), transparent 70%)",
      "radial-gradient(45% 40% at 92% 18%, rgba(255,214,10,0.05), transparent 70%)",
    ].join(", "),
  },
  {
    id: "how",
    background: [
      "radial-gradient(55% 60% at 88% 55%, rgba(102,81,234,0.11), transparent 70%)",
      "radial-gradient(40% 45% at 10% 20%, rgba(51,115,246,0.06), transparent 70%)",
    ].join(", "),
  },
  {
    id: "rules",
    background:
      "radial-gradient(70% 55% at 50% 90%, rgba(51,115,246,0.07), transparent 72%)",
  },
  {
    id: "hp-final",
    background: [
      "radial-gradient(55% 55% at 20% 75%, rgba(255,128,151,0.08), transparent 70%)",
      "radial-gradient(50% 50% at 80% 30%, rgba(102,81,234,0.08), transparent 70%)",
    ].join(", "),
  },
];

export function ScrollScenes() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    SCENES.forEach((scene) => {
      const section = document.getElementById(scene.id);
      const layer = rootRef.current?.querySelector<HTMLElement>(`[data-scene="${scene.id}"]`);
      if (!section || !layer) return;

      // Fade the scene in as its section approaches mid-viewport and back out
      // as it leaves; scrub ties both directly to scroll position.
      gsap.fromTo(
        layer,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top 30%",
            scrub: true,
          },
        }
      );
      gsap.to(layer, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "bottom 70%",
          end: "bottom 15%",
          scrub: true,
        },
      });
    });
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {SCENES.map((scene) => (
        <div
          key={scene.id}
          data-scene={scene.id}
          className="absolute inset-0 opacity-0"
          style={{ background: scene.background }}
        />
      ))}
    </div>
  );
}
