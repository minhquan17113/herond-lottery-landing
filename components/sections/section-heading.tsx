import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title?: ReactNode;
  /** Optional one-liner under the title; keeps its own measure. */
  sub?: ReactNode;
}

/**
 * Section head. Owns its own scroll reveal so every section title enters the
 * same way. Titles wrap balanced (no orphan word on the second line) and stay
 * on a readable measure. The eyebrow-plus-hairline strip is opt-in and
 * rationed to at most one visible instance per few sections.
 */
export function SectionHeading({ eyebrow, title, sub }: SectionHeadingProps) {
  return (
    <Reveal>
      {eyebrow && (
        <div className={title ? "mb-4 flex items-center gap-4" : "mb-8 flex items-center gap-4"}>
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-[var(--hp-hairline)]" />
        </div>
      )}
      {title && (
        <h2
          className={`max-w-[22ch] text-balance text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.12] tracking-[-0.025em] ${
            sub ? "mb-3" : "mb-10"
          }`}
        >
          {title}
        </h2>
      )}
      {sub && (
        <p className="mb-10 max-w-[46ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </Reveal>
  );
}
