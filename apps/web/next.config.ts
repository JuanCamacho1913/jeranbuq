import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@barberia-jeranbuq/database",
    "@barberia-jeranbuq/shared",
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
