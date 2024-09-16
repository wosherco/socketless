import { createSocketless } from "socketless.ws/server";
import { z } from "zod";

import { env } from "~/env";

export const socketless = createSocketless<string, string>({
  clientId: env.SOCKETLESS_CLIENT_ID,
  token: env.SOCKETLESS_TOKEN,
  url: env.SOCKETLESS_URL,
  messageValidator: z.string(),
  onConnect(context, identifier) {
    context.send(`${identifier} connected`, { feeds: ["landing"] });
  },
  onDisconnect(context, identifier) {
    context.send(`${identifier} disconnected`, { feeds: ["landing"] });
  },
  onMessage(context, identifier, message) {
    context.send(`${identifier}: "${message}"`, { feeds: ["landing"] });
  },
});
