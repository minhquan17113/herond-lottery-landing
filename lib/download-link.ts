"use client";

import { useEffect, useState } from "react";
import { HEROND_POINT_LINK } from "@/data/season";

/** Bump when a new Herond Browser build ships. */
const VERSION = "2_6_7";

/** Generic download page — used whenever OS/arch can't be resolved confidently. */
const FALLBACK_LINK = "https://herond.org/download";

export type CtaIcon = "herond" | "apple" | "windows" | "android" | "appstore" | "mobile";

interface HerondNavigator extends Navigator {
  herond?: { isHerond?: () => boolean };
}

/**
 * Herond Browser injects a dedicated `navigator.herond` API (mirrors
 * `navigator.brave` in Brave) — no UA sniffing needed.
 */
function isHerondBrowser(): boolean {
  try {
    return !!(window.navigator as HerondNavigator).herond?.isHerond?.();
  } catch {
    return false;
  }
}

/**
 * Opens the Herond Point sidebar from within Herond Browser.
 * TODO(dev): the browser has not wired `window.openHerondPointSidebar` yet —
 * this is a no-op until that API ships.
 */
function openHerondPointSidebar(): void {
  const win = window as Window & { openHerondPointSidebar?: () => void };
  win.openHerondPointSidebar?.();
}

interface CryptoLibGlobal {
  CryptoLib?: {
    trackEvent?: (event: {
      eventName: string;
      category: string;
      description: string;
      platform: string;
      browserVersion: string;
    }) => void;
  };
}

/** Fires the `click_download` acquisition event — a no-op if CryptoLib hasn't loaded. */
function trackDownloadClick(platform: string): void {
  (globalThis as unknown as CryptoLibGlobal).CryptoLib?.trackEvent?.({
    eventName: "click_download",
    category: "Acquisition",
    description: "Click download button",
    platform,
    browserVersion: VERSION,
  });
}

/** Reliable Safari detection via vendor string (more robust than UA regex). */
function isSafari(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Safari/i.test(navigator.userAgent) &&
    /Apple Computer/i.test(navigator.vendor)
  );
}

/** Detects Apple Silicon via the WebGL renderer string — works in Safari, which hides userAgentData. */
function detectMacArchViaWebGL(): "arm" | "x64" | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string;

    // Safari < 16.4: renderer = "Apple M1 GPU", "Apple M2 GPU", etc.
    if (/Apple M\d/i.test(renderer)) return "arm";
    // Safari 16.4+: renderer is the generic "Apple GPU" (privacy reasons) — only
    // appears on Apple Silicon; Intel Macs report "Intel Iris", "AMD Radeon", etc.
    if (/Apple GPU/i.test(renderer) && /Apple/i.test(vendor)) return "arm";

    return "x64";
  } catch {
    return null;
  }
}

interface DownloadTarget {
  /** Full description — surfaced via title/aria-label, not the compact button text. */
  title: string;
  icon: CtaIcon;
  link: string;
}

const DOWNLOADS: Record<string, DownloadTarget> = {
  "Mac-arm": {
    title: "Download for macOS (Apple Silicon)",
    icon: "apple",
    link: `https://dl.herond.org/mac_stable_arm64/herond_browser_${VERSION}.dmg`,
  },
  "Mac-x64": {
    title: "Download for macOS (Intel)",
    icon: "apple",
    link: `https://dl.herond.org/mac_stable_x64/herond_browser_${VERSION}.dmg`,
  },
  "Windows-x64": {
    title: "Download for Windows",
    icon: "windows",
    link: `https://dl.herond.org/win_stable_x64/herond_installer_meta_en_${VERSION}.exe`,
  },
  "Windows-x86": {
    title: "Download for Windows (32-bit)",
    icon: "windows",
    link: `https://dl.herond.org/win_stable_x86/herond_installer_meta_en_32_${VERSION}.exe`,
  },
  Android: {
    title: "Get on Google Play",
    icon: "android",
    link: "https://play.google.com/store/apps/details?id=com.herond.android.browser&hl=en",
  },
  iOS: {
    title: "Download on App Store",
    icon: "appstore",
    link: "https://apps.apple.com/vn/app/herond-browser/id6462850011",
  },
  Other: { title: "Download Herond", icon: "mobile", link: FALLBACK_LINK },
};

function resolveDownload(os: string, arch: string): DownloadTarget {
  const key = os === "Mac" || os === "Windows" ? `${os}-${arch}` : os;
  return DOWNLOADS[key] ?? DOWNLOADS[os] ?? DOWNLOADS.Other;
}

/** Public download-link resolver — the same endpoint points.herond.org calls for its own button. */
const MANAGEMENT_API_BASE = "https://management-api.herond.org";

/**
 * Maps detected OS/arch to the backend's platform/arch params, or null for
 * app-store targets. Only Mac/Windows carry a hardcoded VERSION that can go
 * stale; Android/iOS point at app stores, always current on their own.
 */
function toBackendParams(os: string, arch: string): { platform: string; arch: string } | null {
  if (os === "Mac") return { platform: "mac", arch: arch === "arm" ? "arm64" : "x64" };
  if (os === "Windows") return { platform: "win", arch: arch === "x86" ? "x86" : "x64" };
  return null;
}

/** Fetches the always-latest installer URL from the management API. */
async function fetchLiveDownloadUrl(
  platform: string,
  arch: string,
  signal: AbortSignal
): Promise<string | null> {
  const res = await fetch(
    `${MANAGEMENT_API_BASE}/api/public/downloads/link?${new URLSearchParams({ platform, arch })}`,
    { signal }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { downloadUrl?: string };
  return data.downloadUrl ?? null;
}

interface NavigatorUAData {
  getHighEntropyValues(hints: string[]): Promise<{ architecture?: string; bitness?: string }>;
}

export interface SmartCta {
  /** Link target — the resolved installer/App Store/Play Store URL, or "#" in claim mode. */
  href: string;
  /** Compact button label — "Claim your ticket" inside Herond Browser, "Download Herond" otherwise. */
  label: string;
  /** Full description for the title/aria-label tooltip (e.g. "Download for macOS (Apple Silicon)"). */
  title: string;
  /** Platform-specific glyph: Apple/Windows/Android/App Store/generic mobile, or the Herond star. */
  icon: CtaIcon;
  /** Omitted in claim mode so the sidebar opens in-place instead of a new tab. */
  target?: "_blank";
  /** Set only in claim mode: opens the Herond Point sidebar instead of navigating. */
  onClick?: (e: React.MouseEvent) => void;
  /**
   * DOM marker Herond Browser can hook to drive the sidebar itself, independent
   * of our JS handler. Present only in claim mode.
   */
  "data-herond-action"?: "open-points-sidebar";
}

const INITIAL: SmartCta = {
  href: HEROND_POINT_LINK,
  label: "Download Herond",
  title: "Download Herond",
  icon: "mobile",
  target: "_blank",
};

/**
 * Resolves the primary CTA for the visitor, client-side only.
 *
 * Inside Herond Browser, the button becomes "Claim your ticket" (star icon) and
 * opens the Herond Point sidebar. Everywhere else it resolves the right install
 * link — and matching OS icon — for the visitor's platform + architecture,
 * starting at HEROND_POINT_LINK during detection/SSR.
 */
export function useSmartCta(): SmartCta {
  const [cta, setCta] = useState<SmartCta>(INITIAL);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    // One controller for the live-link fetch(es); aborted on unmount or after 15s.
    let cancelled = false;
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 15000);
    const cleanup = () => {
      cancelled = true;
      clearTimeout(timeoutId);
      ac.abort();
    };

    if (isHerondBrowser()) {
      setCta({
        href: "#",
        label: "Claim your ticket",
        title: "Claim your ticket",
        icon: "herond",
        "data-herond-action": "open-points-sidebar",
        onClick: (e) => {
          e.preventDefault();
          openHerondPointSidebar();
        },
      });
      return cleanup;
    }

    const applyDownload = (os: string, arch: string) => {
      const resolved = resolveDownload(os, arch);
      setCta({
        href: resolved.link,
        label: "Download Herond",
        title: resolved.title,
        icon: resolved.icon,
        target: "_blank",
        onClick: () => trackDownloadClick(`${os}_${arch}`),
      });

      // Progressive enhancement: the static VERSION-based link above works
      // immediately; silently upgrade it to the live latest-version URL. Any
      // failure (network, CORS, bad response) just leaves the fallback in place.
      const backendParams = toBackendParams(os, arch);
      if (backendParams) {
        fetchLiveDownloadUrl(backendParams.platform, backendParams.arch, ac.signal)
          .then((url) => {
            if (!cancelled && url) setCta((prev) => ({ ...prev, href: url }));
          })
          .catch(() => {});
      }
    };

    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";

    let os = "Other";
    if (/iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      os = "iOS";
    } else if (/android/i.test(ua)) {
      os = "Android";
    } else if (/Win/i.test(ua)) {
      os = "Windows";
    } else if (/Mac/i.test(ua)) {
      os = "Mac";
    }

    // macOS Safari: WebGL renderer instead of userAgentData (Safari doesn't expose it).
    if (os === "Mac" && isSafari()) {
      applyDownload(os, detectMacArchViaWebGL() ?? "x64");
      return cleanup;
    }

    const nav = navigator as Navigator & { userAgentData?: NavigatorUAData };
    if (nav.userAgentData) {
      nav.userAgentData
        .getHighEntropyValues(["architecture", "bitness"])
        .then((data) => {
          let arch = "";
          if (os === "Windows") arch = data.bitness === "64" ? "x64" : "x86";
          if (os === "Mac") arch = data.architecture === "arm" ? "arm" : "x64";
          applyDownload(os, arch);
        })
        .catch(() => applyDownload(os, ""));
      return cleanup;
    }

    // UA-string fallback (no userAgentData — Safari on Mac already handled above).
    let arch = "";
    if (os === "Windows") {
      arch = ua.includes("Win64") || ua.includes("WOW64") ? "x64" : "x86";
    } else if (os === "Mac") {
      arch = "x64";
    }
    applyDownload(os, arch);
    return cleanup;
  }, []);

  return cta;
}
