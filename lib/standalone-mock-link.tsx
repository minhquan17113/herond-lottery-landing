import React from "react";

/**
 * Drop-in replacement for `next/link`, used only when bundling the standalone
 * single-file HTML export (see scripts/build-standalone-html.mjs) — that
 * build has no Next.js runtime to resolve the real import against.
 */
export default function Link({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
