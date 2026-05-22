import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** Chart library is browser-only; avoid Turbopack pulling it into server chunks. */
  serverExternalPackages: ["lightweight-charts"],
};

export default nextConfig;
