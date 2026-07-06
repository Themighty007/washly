import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/db/**/*"],
    },
  },
};

export default nextConfig;
