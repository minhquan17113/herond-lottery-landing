"use client";

import Link from "next/link";
import { CtaGlyph } from "@/components/icons";
import { useSmartCta } from "@/lib/download-link";

/** Fixed bottom CTA shown only on small screens (media-query driven, no JS resize listener). */
export function StickyMobileCta() {
  const cta = useSmartCta();

  return (
    <div className="hp-sticky-cta sticky bottom-0 z-20 border-t border-border bg-background/85 px-4 py-3 backdrop-blur-xl sm:hidden">
      <Link
        href={cta.href}
        target={cta.target}
        onClick={cta.onClick}
        title={cta.title}
        aria-label={cta.title}
        data-herond-action={cta["data-herond-action"]}
        className="flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-[15px] font-semibold text-white no-underline shadow-[0_8px_24px_-6px_rgba(51,115,246,0.55)]"
      >
        <CtaGlyph icon={cta.icon} className="size-[18px] text-white" />
        {cta.label}
      </Link>
    </div>
  );
}
