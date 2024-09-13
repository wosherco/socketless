import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

import baseConfig from "@socketless/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    // ...baseConfig.content,
    "../../internal-packages/ui/src/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,mdx}",
    "./docs/**/*.{ts,tsx,mdx}",
    "./static/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: ["class", '[data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  blocklist: ["container"],
} satisfies Config;
