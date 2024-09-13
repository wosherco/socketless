import baseConfig, { restrictEnvAccess } from "@socketless/eslint-config/base";
import nextjsConfig from "@socketless/eslint-config/nextjs";
import reactConfig from "@socketless/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
