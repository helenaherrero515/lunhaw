#!/usr/bin/env node
/**
 * Copies MapLibre's background worker into public/vendor/ so the site serves it from its own domain.
 *
 * MapLibre 6 normally finds its worker next to its own script file, but once the app is bundled that
 * location no longer exists. real-map.ts points MapLibre at /vendor/maplibre-gl-worker.js instead.
 * The copy is generated (gitignored) and refreshed on every dev/build, so it always matches the installed version.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const outDir = resolve(here, "../public/vendor");

mkdirSync(outDir, { recursive: true });
copyFileSync(resolve(pkgDir, "dist/maplibre-gl-worker.mjs"), resolve(outDir, "maplibre-gl-worker.js"));
console.log("Copied MapLibre worker to public/vendor/maplibre-gl-worker.js");
