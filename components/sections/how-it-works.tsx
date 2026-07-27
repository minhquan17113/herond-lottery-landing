"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/sections/section-heading";
import { CtaLink } from "@/components/cta-link";
import { FooterAurora } from "@/components/footer-aurora";

const STEPS = [
  {
    n: 1,
    title: "Install",
    body: "Get Herond Browser on iOS, Android, or desktop. Under a minute.",
    image: "/assets/how-it-works/step-1.webp",
  },
  {
    n: 2,
    title: "Check in daily",
    body: "One tap a day in Herond Point earns one ticket.",
    image: "/assets/how-it-works/step-2.webp",
  },
  {
    n: 3,
    title: "Stay active, win more",
    body: "Check in 5 of 7 days for a bonus ticket. Every ticket rides in each Sunday draw and the season's Grand Draw.",
    image: "/assets/how-it-works/step-3.webp",
  },
] as const;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Desktop scrolltelling: as each step block crosses mid-viewport, it takes
  // over the sticky panel. IntersectionObserver only; no scroll listeners.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = blockRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx >= 0) setActive(idx);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    blockRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const panel = (
    <div
      className="rounded-2xl p-px shadow-[0_24px_60px_-30px_rgba(37,99,235,0.45)]"
      style={{
        background:
          "linear-gradient(150deg, rgba(51,115,246,0.55), rgba(102,81,234,0.4) 45%, rgba(255,128,151,0.35) 100%)",
      }}
    >
      <div className="relative overflow-hidden rounded-[17px] bg-card px-5 py-5">
        <FooterAurora className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-background/55" />
        {/* All three step images stay mounted, stacked; the active one fades
            up so switching steps is a crossfade, never a load flash. */}
        <div className="relative z-10 mx-auto aspect-[1200/1142] w-full max-w-[420px]">
          {STEPS.map((s, i) => (
            <Image
              key={s.image}
              src={s.image}
              alt={s.title}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 1024px) 100vw, 460px"
              priority={i === 0}
              className={`rounded-xl transition-opacity duration-500 ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section id="how" className="py-[clamp(72px,10vw,128px)]">
      <div className="mx-auto w-full max-w-[1080px] px-6">
        <SectionHeading
          title="Three steps to your first ticket"
          sub="Install once, check in daily. Every ticket enters the draws automatically."
        />

        {/* Desktop: scroll story. The panel sticks mid-viewport while the
            step beats scroll past; each beat is mostly whitespace with one
            headline and one line of copy. */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16">
          <div>
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                className={`flex min-h-[62vh] flex-col justify-center transition-opacity duration-500 ${
                  active === i ? "opacity-100" : "opacity-35"
                }`}
              >
                <span
                  className={`mb-5 flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-extrabold transition-colors ${
                    active === i
                      ? "bg-gradient-to-b from-[var(--hp-cta-from)] to-[var(--hp-cta-to)] text-white"
                      : "bg-[#2d2d2e] text-white/40"
                  }`}
                >
                  {s.n}
                </span>
                <h3 className="mb-3 text-[26px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="max-w-[380px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                {i === 0 && (
                  <CtaLink className="mt-6 self-start px-6 py-3 text-[14px]" />
                )}
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="sticky top-[calc(50vh-260px)]">{panel}</div>
          </div>
        </div>

        {/* Mobile/tablet: the proven tap-through layout. Image up top for
            thumb reach, fixed-height copy so switching never shifts layout,
            tabs pinned to the bottom. */}
        <div className="lg:hidden">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative overflow-hidden px-5 pb-5 pt-5">
              <FooterAurora className="pointer-events-none absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute inset-0 bg-background/55" />
              <div className="relative z-10">
                <div className="relative mx-auto aspect-[1200/1142] w-full max-w-[420px] overflow-hidden rounded-xl">
                  <Image
                    key={step.image}
                    src={step.image}
                    alt={step.title}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 640px) 100vw, 420px"
                    priority={active === 0}
                  />
                </div>
                <div
                  className={`mt-5 flex justify-center ${active === 0 ? "" : "invisible"}`}
                  aria-hidden={active !== 0}
                >
                  <CtaLink className="px-6 py-3 text-[14px]" tabIndex={active === 0 ? 0 : -1} />
                </div>
              </div>
            </div>

            <p className="flex min-h-[110px] items-center justify-center text-pretty px-6 py-4 text-center text-[13.5px] leading-relaxed text-muted-foreground">
              {step.body}
            </p>

            <div className="grid grid-cols-1 border-t border-white/[0.06] sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  className={`flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5 text-left transition-colors last:border-b-0 sm:border-b-0 sm:not-last:border-r sm:border-white/[0.06] ${
                    active === i ? "bg-[var(--card-hover)]" : "hover:bg-[var(--card-hover)]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-extrabold ${
                      active === i
                        ? "bg-gradient-to-b from-[var(--hp-cta-from)] to-[var(--hp-cta-to)] text-white"
                        : "bg-[#2d2d2e] text-white/40"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span
                    className={`text-[13.5px] font-bold ${active === i ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
