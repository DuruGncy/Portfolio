import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile elsewhere doesn't confuse Turbopack.
  turbopack: { root: __dirname },
  // Deploy-agnostic static export → works on AWS S3+CloudFront / Amplify or Vercel.
  output: "export",
  // Static export cannot use the on-demand Image Optimization API.
  images: { unoptimized: true },
  // Emit /section/index.html paths for clean static hosting on any object store.
  trailingSlash: true,
};

export default nextConfig;
