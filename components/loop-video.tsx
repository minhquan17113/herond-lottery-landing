"use client";

import { useEffect, useRef } from "react";

interface LoopVideoProps {
  /** One source, or several in fallback order (e.g. mp4 before webm — iOS has no WebM decoder). */
  src: string | string[];
  className?: string;
}

const EXT_TYPE: Record<string, string> = { mp4: "video/mp4", webm: "video/webm" };

/**
 * Fully decorative, always-on looping video: no controls, no play button,
 * never focusable or tappable. Force-retries `.play()` on visibility/tab
 * changes and after any pause, since mobile Safari silently pauses
 * backgrounded video and won't resume a `loop`ed clip on its own — the
 * fallback otherwise a stalled frame with a native play glyph.
 */
export function LoopVideo({ src, className }: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const sources = Array.isArray(src) ? src : [src];

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // React/SSR doesn't reliably set the `.muted` DOM *property* on hydration
    // (only the HTML attribute) — https://github.com/facebook/react/issues/10389.
    // A video with an audio track that's attribute-muted but property-unmuted
    // fails the browser's autoplay-eligibility check and falls back to a
    // native tap-to-play affordance instead of just autoplaying.
    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = () => {
      // Only on an actually-foregrounded tab — retrying on a hidden tab (or
      // reacting to our own `pause` handler's side effects) is what caused
      // the request-abort storm this replaced: every play() interrupts the
      // in-flight one, so the video never finishes loading past readyState 0.
      if (document.hidden) return;
      video.muted = true;
      video.play().catch(() => {
        // Autoplay can be rejected without a user gesture; the listeners
        // below retry once one arrives. Never surface a play button instead.
      });
    };

    tryPlay();
    document.addEventListener("visibilitychange", tryPlay);
    window.addEventListener("pageshow", tryPlay);

    return () => {
      document.removeEventListener("visibilitychange", tryPlay);
      window.removeEventListener("pageshow", tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      tabIndex={-1}
      aria-hidden="true"
      className={`pointer-events-none touch-none select-none ${className ?? ""}`}
    >
      {sources.map((s) => {
        const ext = s.split(".").pop() ?? "";
        return <source key={s} src={s} type={EXT_TYPE[ext]} />;
      })}
    </video>
  );
}
