// Produces one self-contained HTML file (markup + CSS + JS, no build step to
// run it — assets stay external via relative paths, same as the reference
// standalone.html this replaces the Framer export with) that mirrors the
// live site pixel-for-pixel. Run after `next build`: it reuses that build's
// compiled Tailwind CSS rather than recompiling styles.
//
// The output is written to the project root, next to `public/` and `app/` —
// opening it directly (double-click, drag into a browser tab) must work with
// no server, so every asset reference gets rewritten from the app's
// root-absolute form ("/assets/...", which file:// resolves against the
// filesystem root, not this folder) to a path relative to this file
// ("public/assets/...").
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import esbuild from "esbuild";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
const outFile = join(rootDir, `${pkg.name}.html`);

function findBuiltCss() {
  const cssDir = join(rootDir, ".next/static/chunks");
  const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
  if (!cssFiles.length) {
    throw new Error("No compiled CSS found in .next/static/chunks — run `next build` first.");
  }
  return cssFiles.map((f) => readFileSync(join(cssDir, f), "utf8")).join("\n");
}

async function bundleJs() {
  const result = await esbuild.build({
    entryPoints: [join(rootDir, "lib/standalone-entry.tsx")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify: true,
    jsx: "transform",
    alias: {
      // Two distinct files, not one shared module — aliasing both specifiers
      // to the same file meant `Image`'s default import silently resolved to
      // that file's Link export instead (both default exports collapse to
      // whichever one the module records first).
      "next/link": join(rootDir, "lib/standalone-mock-link.tsx"),
      "next/image": join(rootDir, "lib/standalone-mock-image.tsx"),
    },
    loader: { ".tsx": "tsx", ".ts": "ts" },
  });
  return result.outputFiles[0].text;
}

/** Root-absolute app asset paths → relative to this file's own location on disk. */
function toRelativeAssetPaths(text) {
  return text.replaceAll("/assets/", "public/assets/");
}

const [css, jsRaw] = await Promise.all([Promise.resolve(findBuiltCss()), bundleJs()]);
const js = toRelativeAssetPaths(jsRaw);

const html = `<!doctype html>
<html lang="en" class="h-full antialiased">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Herond Point · Lottery Ticket</title>
<meta name="description" content="Check in daily, earn tickets, and win a share of the $10,000 Season 1 lottery pool with Herond Point.">
<link rel="icon" href="app/favicon.ico" sizes="256x256">
<link rel="icon" href="app/icon.svg" type="image/svg+xml">
<style>${css}</style>
</head>
<body class="flex min-h-full flex-col">
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;

writeFileSync(outFile, html, "utf8");
console.log(`Standalone HTML written to ${outFile} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
