import type { TRPCRouterRecord } from "@trpc/server";

import { HomeContactFormSchema } from "@socketless/validators/forms";

import { publicProcedure } from "../trpc";

// TODO: Move?
const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1252987848605569024/tAU4__D--JCyTlLCMwea3cBwQq4RmIptqPB4h17GiV4g23Wm5ZsmyZDBj7a1_ELuAweS";

export const homeRouter = {
  contact: publicProcedure
    .input(HomeContactFormSchema)
    .mutation(async ({ ctx, input }) => {
      const WH_DATA = {
        content: "@everyone",
        embeds: [
          {
            title: "New message",
            description: `${input.message}`,
            color: 5814783,
            fields: [
              {
                name: "Ip",
                value: `${ctx.headers.get("CF-Connecting-IP")}`,
                inline: true,
              },
              {
                name: "UA",
                value: `${ctx.headers.get("User-Agent")}`,
                inline: true,
              },
              {
                name: "Name",
                value: `${input.name}`,
              },
              {
                name: "Email",
                value: `${input.email}`,
              },
            ],
            author: {
              name: `${ctx.user?.username} - ${ctx.user?.id}`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        username: "Contact Form",
        attachments: [],
      };

      const req = await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(WH_DATA),
      });

      if (req.status < 300) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
        };
      }
    }),
} satisfies TRPCRouterRecord;
