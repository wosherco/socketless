import baseConfig, { restrictEnvAccess } from "@socketless/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", ".astro/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
