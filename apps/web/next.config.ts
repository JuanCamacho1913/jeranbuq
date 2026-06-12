import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@barberia-jeranbuq/database",
    "@barberia-jeranbuq/shared",
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
