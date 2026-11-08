/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every route is static, so the site is exported as plain files and served by Cloudflare Pages
  // (public/_headers carries the security headers). Data comes from the Lunhaw API at runtime.
  output: "export",
  // Optional: build into another folder (e.g. while a dev server is using .next). The exported
  // site is then written into that folder instead of out/.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  transpilePackages: ["@lunhaw/ui"],
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
