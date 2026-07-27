import React from "react";

/**
 * Drop-in replacement for `next/image`, used only when bundling the
 * standalone single-file HTML export (see scripts/build-standalone-html.mjs)
 * — that build has no Next.js image server to resolve the real import
 * against. Kept in its own module (not alongside the `next/link` mock) so
 * each aliased specifier resolves to a distinct default export — sharing one
 * file previously meant `Image`'s default import silently resolved to the
 * Link component instead.
 */
interface MockImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  fill?: boolean;
}

export default function Image({ src, alt, fill, style, ...props }: MockImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- no Next.js image server in the standalone build
    <img
      src={src}
      alt={alt}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...props}
    />
  );
}
