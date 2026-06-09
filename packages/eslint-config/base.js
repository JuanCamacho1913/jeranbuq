import tseslint from "typescript-eslint";

/**
 * Shared base ESLint flat config (ESLint 9+).
 * Spread this array in your workspace eslint.config.js.
 *
 * @type {import("typescript-eslint").ConfigArray}
 */
const config = [
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default config;
