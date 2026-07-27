"use client";

import { TiltCard } from "@/components/tilt-card";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { SectionHeading } from "@/components/sections/section-heading";
import { PointIcon } from "@/components/icons";
import { GradientText } from "@/components/gradient-text";

export function RewardsWinners() {
  return (
    <section id="rewards" className="py-[clamp(72px,10vw,128px)]">
      <div className="mx-auto w-full min-w-0 max-w-[1080px] px-6">
        <SectionHeading
          eyebrow="Rewards"
          title={
            <>
              <GradientText className="rounded-lg bg-background px-1">
                <CountUp value={10000} prefix="$" className="tabular-nums" />
              </GradientText>{" "}
              Up for grabs
            </>
          }
          sub="Real prizes every week, plus a Grand Draw built from every ticket you've earned all season."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal>
            <PoolCard
              badge="WEEKLY POOL"
              badgeColor="#3373f6"
              badgeBg="rgba(51,115,246,0.12)"
              cadence="Every Sunday"
              amountValue={400}
              winners="30"
              note="Each weekly draw uses only that week's tickets."
              prizes={[
                "$20 (ETH on Base)",
                "$10 (ETH on Base)",
                "$5 (ETH on Base)",
                "Google Play $10",
                "Starbucks $5",
              ]}
            />
          </Reveal>
          <Reveal delay={0.12}>
            <PoolCard
              badge="GRAND DRAW POOL"
              badgeColor="#ffd60a"
              badgeBg="rgba(255,195,0,0.12)"
              cadence="End of Season 1"
              amountValue={8000}
              winners="500+"
              note="Every ticket you've earned all season counts, plus any bonus tickets."
              prizes={[
                "$1,500 (ETH on Base)",
                "$400 (ETH on Base)",
                "$200 (ETH on Base)",
                "$10 (ETH on Base)",
                "Google Play $10",
                "$5 (ETH on Base)",
                "Starbucks $5",
              ]}
              glow
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

interface PoolCardProps {
  badge: string;
  badgeColor: string;
  badgeBg: string;
  cadence: string;
  amountValue: number;
  winners: string;
  note: string;
  prizes: string[];
  glow?: boolean;
}

function PoolCard({
  badge,
  badgeColor,
  badgeBg,
  cadence,
  amountValue,
  winners,
  note,
  prizes,
  glow,
}: PoolCardProps) {
  return (
    <TiltCard
      className={`h-full overflow-hidden ${
        glow
          ? "border-[rgba(255,214,10,0.28)] p-6 hover:border-[rgba(255,214,10,0.45)]"
          : "p-6"
      }`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[.08em]"
          style={{ background: badgeBg, color: badgeColor }}
        >
          <PointIcon className="size-3" style={{ color: badgeColor }} /> {badge}
        </div>
        <div className="text-[13px] font-medium text-muted-foreground">{cadence}</div>
      </div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[36px] font-bold tracking-[-0.02em] tabular-nums">
          Up to <CountUp value={amountValue} prefix="$" />
        </div>
        <div className="text-[13px] text-muted-foreground">
          <b className="text-[15px] text-foreground">{winners}</b> winners{" "}
          {winners === "500+" ? "" : "/ week"}
        </div>
      </div>
      <p className="mb-4 text-pretty text-[13px] leading-snug text-muted-foreground">{note}</p>
      {/* Perforated seam with edge notch bites — the same torn-ticket motif as
          the final CTA, so the pool cards read as ticket stubs. */}
      <div className="relative -mx-6 mb-3.5">
        <div className="mx-6 border-t border-dashed border-[var(--hp-hairline)]" />
        <span className="absolute -left-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-border bg-background" />
        <span className="absolute -right-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-border bg-background" />
      </div>
      <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[.1em] text-white/30">
        Prize breakdown
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prizes.map((prize) => (
          <span
            key={prize}
            className="whitespace-nowrap rounded-full bg-[var(--hp-muted-pill)] px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground"
          >
            {prize}
          </span>
        ))}
      </div>
    </TiltCard>
  );
}
