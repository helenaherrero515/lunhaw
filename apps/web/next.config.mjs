/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lunhaw/ui"],
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
