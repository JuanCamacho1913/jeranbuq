import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";
import baseConfig from "./base.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Next.js ESLint flat config (ESLint 9+).
 * Extends the shared base config and adds Next.js core-web-vitals rules.
 * Spread this array in your apps/web eslint.config.js.
 *
 * @type {import("typescript-eslint").ConfigArray}
 */
const config = [
  ...compat.extends("next/core-web-vitals"),
  ...baseConfig,
];

export default config;
