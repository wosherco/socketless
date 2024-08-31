import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'

// https://astro.build/config
export default defineConfig({
  site: "https://docs.socketless.ws",
  integrations: [
    starlight({
      title: "Socketless",
      social: {
        github: "https://github.com/wosherco",
      },
      plugins: [
        starlightOpenAPI([
          {
            base: 'api',
            label: 'My API',
            schema: 'http://localhost:3000/api/doc',
          },
        ]),
      ],
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
        ...openAPISidebarGroups,
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
