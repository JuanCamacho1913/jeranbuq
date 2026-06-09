import nextConfig from "@barberia-jeranbuq/eslint-config/next.js";

/**
 * ESLint flat config for apps/web.
 * Spreads the shared Next.js config from @barberia-jeranbuq/eslint-config.
 *
 * @type {import("typescript-eslint").ConfigArray}
 */
const config = [...nextConfig];

export default config;
