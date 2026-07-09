import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "**": ["apps/web/generated/prisma/**/*.node"],
  },
  transpilePackages: [
    "@barberia-jeranbuq/database",
    "@barberia-jeranbuq/shared",
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  webpack: {
    autoInstrumentMiddleware: false,
  },
});
