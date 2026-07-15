import { PointIcon } from "@/components/icons";

const ITEMS = [
  "$10,000 Season 1 pool",
  "30 winners every Sunday",
  "Paid in ETH on Base",
  "Tickets never expire",
  "5/7 days active = bonus ticket",
];

/**
 * Single brand ticker between the hero and the rewards section — the one
 * marquee on the page. Pure CSS animation (pauses under reduced motion via
 * the global media query), duplicated list for the seamless loop.
 */
export function Ticker() {
  const row = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex flex-none items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
    >
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center gap-3 whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.14em] text-white/45"
        >
          <PointIcon className="size-3.5 text-primary/70" />
          {item}
        </span>
      ))}
    </div>
  );

  return (
    // A <section> so the intro's `main > section:nth-child(n+2)` gating hides
    // it until the hero fly-in completes, like every other below-hero block.
    <section aria-label="Season highlights" className="relative overflow-hidden border-y border-border py-4">
      <div className="flex w-max animate-[hp-marquee_36s_linear_infinite]">
        {row(false)}
        {row(true)}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
    </section>
  );
}
