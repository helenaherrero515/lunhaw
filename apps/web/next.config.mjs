/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lunhaw/ui"],
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Separate development and production build caches to prevent next build from corrupting next dev
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
