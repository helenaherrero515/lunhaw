#!/usr/bin/env node
// Renders scripts/media/readme-story.html frame by frame with Playwright and
// writes PNG frames to a temp folder. Assemble them into docs/media/lunhaw.gif
// with scripts/media/frames-to-gif.py.
//
//   node scripts/media/render-readme-gif.mjs <out-dir> [fps]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// Playwright is a dev dependency of apps/web; borrow it from there.
const { chromium } = createRequire(join(here, '../../apps/web/package.json'))('@playwright/test');
const outDir = process.argv[2];
const fps = Number(process.argv[3] ?? 15);
if (!outDir) {
  console.error('usage: node render-readme-gif.mjs <out-dir> [fps]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 720, height: 405 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'readme-story.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * fps);
for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  await page.screenshot({ path: join(outDir, `f${String(i).padStart(4, '0')}.png`) });
}
await browser.close();
console.log(`${total} frames → ${outDir}`);
