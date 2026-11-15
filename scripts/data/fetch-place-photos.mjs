#!/usr/bin/env node
/**
 * Downloads cover photos for places from Wikimedia Commons, with the credit each licence requires.
 *
 * Only freely licensed Commons files are used, never photos copied from other websites. Each file
 * below was checked by a person to show that exact place (same building or park, same branch), and
 * places without a confirmed photo keep the illustrated cover. Add a place by finding its photo on
 * https://commons.wikimedia.org, confirming it matches, and adding its "File:" title here.
 *
 * Writes:
 *   apps/web/public/places/<place id>.webp   720×480 cover crops
 *   apps/web/src/lib/place-photos.json       { [place id]: { src, author, license, licenseUrl, source } }
 *
 * Usage: node scripts/data/fetch-place-photos.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// sharp ships with Next.js (its image optimiser), so load it from there instead of adding a dependency.
const require = createRequire(resolve(root, "apps/web/package.json"));
const sharp = require(require.resolve("sharp", { paths: [dirname(require.resolve("next/package.json"))] }));

const UA = "LunhawPhotoFetcher/1.0 (https://lunhaw.pages.dev; lunhaw.hln@gmail.com)";

// place id -> Commons file title (checked by hand; see header)
const PHOTOS = {
  "ae100000-0000-4000-8000-000000000001": "File:National Library of the Philippines in February 2026 2.jpg",
  "ae100000-0000-4000-8000-000000000002": "File:Manila City Library, Jun 2024.jpg",
  "ae100000-0000-4000-8000-000000000003": "File:Quezon City Public Library 2017.jpg",
  "ae100000-0000-4000-8000-000000000005": "File:The Caloocan High School 14.jpg",
  "ae100000-0000-4000-8000-000000000009": "File:Mandaluyong Library.jpg", // interior, City Government Complex
  "ae100000-0000-4000-8000-000000000010": "File:Marikina City Library.jpeg",
  "ae200000-0000-4000-8000-000000000001": "File:RizalParkManila20190521.jpg",
  "ae200000-0000-4000-8000-000000000002": "File:Arroceros Forest Park 22Dec2025 07.jpg",
  "ae200000-0000-4000-8000-000000000003": "File:View from the pathway at Paco Park.JPG",
  "ae200000-0000-4000-8000-000000000004": "File:Overview of the Quezon Memorial Circle.jpg",
  "ae200000-0000-4000-8000-000000000005": "File:0964jf Marikina River Park fvf 04.jpg",
  "ae200000-0000-4000-8000-000000000006": "File:Ayala Triangle Gardens Plaza.jpg",
  "ae200000-0000-4000-8000-000000000007": "File:Washington SyCip Park pathway.jpg",
};

const text = (html = "") =>
  html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

const outDir = resolve(root, "apps/web/public/places");
mkdirSync(outDir, { recursive: true });
const credits = {};

for (const [id, title] of Object.entries(PHOTOS)) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", titles: title, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1080" })
    .forEach(([k, v]) => api.searchParams.set(k, v));
  const page = Object.values((await (await fetch(api, { headers: { "User-Agent": UA } })).json()).query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`Commons has no file called ${title}`);
  const m = info.extmetadata ?? {};
  const license = text(m.LicenseShortName?.value);
  // Only licences that allow reuse on a public website with credit.
  if (!/^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$/i.test(license)) throw new Error(`${title}: unexpected licence "${license}"`);

  const image = Buffer.from(await (await fetch(info.thumburl, { headers: { "User-Agent": UA } })).arrayBuffer());
  await sharp(image).rotate().resize(720, 480, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(resolve(outDir, `${id}.webp`));

  credits[id] = {
    src: `/places/${id}.webp`,
    author: text(m.Artist?.value) || "Unknown author",
    license,
    licenseUrl: m.LicenseUrl?.value || null,
    source: info.descriptionurl,
  };
  console.log(`✓ ${title}  (${credits[id].author}, ${license})`);
  await new Promise((r) => setTimeout(r, 300));
}

writeFileSync(resolve(root, "apps/web/src/lib/place-photos.json"), JSON.stringify(credits, null, 2) + "\n");
console.log(`Wrote ${Object.keys(credits).length} photos and apps/web/src/lib/place-photos.json`);
