# Herond Point — Lottery Ticket Landing

Next.js 16 + React 19 landing page for the Herond Point lottery ticket season: 3D holographic ticket hero, scroll-scrubbed "how it works" walkthrough, rewards/winners board, and rules/FAQ.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `components/sections/` — page sections (hero, how-it-works, rewards-winners, rules-faq, final-cta, nav, footer)
- `components/` — shared building blocks (ticket 3D/foil/iridescent effects, ticker, tilt-card, reveal, count-up, cta-link)
- `components/ui/`, `components/animate-ui/` — Radix/shadcn + animation primitives
- `lib/` — download-link resolution, countdown, winners data
- `data/season.ts` — season copy/config (draw dates, prize pool, links)
- `public/assets/` — images, `.glb` ticket models (Draco-compressed), fonts

## Smart CTA

All primary CTAs (`CtaLink` in `components/cta-link.tsx`, plus the nav and sticky-mobile bar) resolve through `useSmartCta()` in [`lib/download-link.ts`](lib/download-link.ts):

| Environment | Label | Behavior |
|---|---|---|
| Herond Browser | "Claim your ticket" | Opens the Herond Point sidebar via `window.openHerondPointSidebar()` |
| Mac (Chrome/Edge — Client Hints) | "Install Herond" | Downloads the `.dmg` for the detected chip (arm64/x64) |
| Mac Safari (chip via WebGL renderer string) | "Install Herond" | Downloads the `.dmg` for the detected chip |
| Windows | "Install Herond" | Downloads the `.exe` (x64 or x86) |
| Android | "Install Herond" | Opens Google Play |
| iOS | "Install Herond" | Opens the App Store |
| Other | "Install Herond" | Opens `herond.org/download` |

Herond Browser is detected via `navigator.herond.isHerond()` — a dedicated API the browser injects (like `navigator.brave.isBrave()` in Brave), not UA sniffing.

### ⚠️ Outstanding: wire the Herond Point sidebar

`window.openHerondPointSidebar()` is not yet implemented by Herond Browser. Until it ships, the "Claim your ticket" click is a no-op — see the `TODO(dev)` in `openHerondPointSidebar()` inside [`lib/download-link.ts`](lib/download-link.ts).

### Bump the installer version

Update `VERSION` in `lib/download-link.ts` — every `.dmg`/`.exe` link is generated from that one constant. Google Play / App Store links are static.
