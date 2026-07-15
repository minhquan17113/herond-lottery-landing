import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title?: ReactNode;
}

/**
 * Section head. The eyebrow-plus-hairline strip is opt-in and rationed to at
 * most one visible instance per few sections; most sections lead with the
 * headline alone.
 */
export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <>
      {eyebrow && (
        <div className={title ? "mb-4 flex items-center gap-4" : "mb-8 flex items-center gap-4"}>
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-[var(--hp-hairline)]" />
        </div>
      )}
      {title && (
        <h2 className="mb-10 text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.025em]">
          {title}
        </h2>
      )}
    </>
  );
}
