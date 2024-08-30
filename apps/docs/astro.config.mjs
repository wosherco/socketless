import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.socketless.ws",
  integrations: [
    starlight({
      title: "Socketless",
      social: {
        github: "https://github.com/wosherco",
      },
      sidebar: [
        {
          label: "Introduction",
          autogenerate: {
            directory: "introduction",
          },
        },
        {
          label: "Webhooks",
          autogenerate: {
            directory: "webhook",
          },
        },
        {
          label: "Push Notifications",
          autogenerate: {
            directory: "push-notifications",
          },
        },
        {
          label: "Billing",
          autogenerate: {
            directory: "billing",
          },
        },
        {
          label: "API Reference",
          autogenerate: {
            directory: "api",
          },
        },
      ],
    }),
  ],
  image: {
    service: passthroughImageService(),
  },
  // vite: {
  // 	ssr: {
  // 		external: ["node:url", "node:path", "node:child_process"],
  // 	},
  // },
  output: "static",
});
