import { z } from "zod";

const NODES_CHANNELS_PREFIX = "nodes:";

export function getMainChannelName(projectId: number, identifier: string) {
  return `connection:${projectId}:${identifier}`;
}

export function getFeedChannelName(projectId: number, feedName: string) {
  return `feed:${projectId}:${feedName}`;
}

export function getWebhooksCacheName(projectId: number) {
  return `webhooks:${projectId}`;
}

export function getHeartbeatChannelName(nodeName: string) {
  return `${NODES_CHANNELS_PREFIX}:heartbeat:${nodeName}`;
}

export type DataKeyType = "incoming" | "outgoing" | "concurrent";

export function getProjectCountKeyname(
  projectId: number,
  datatype: DataKeyType,
) {
  return `${datatype}-count:${projectId}`;
}

export function getProjectLimitKeyname(
  projectId: number,
  datatype: DataKeyType,
) {
  return `${datatype}-limit:${projectId}`;
}

export const PongMessageSchema = z.object({
  node: z.string(),
  message: z.literal("pong"),
  connectedClients: z.array(
    z.object({
      connectionId: z.number().optional(),
      projectId: z.number(),
      identifier: z.string(),
    }),
  ),
});

export type PongMessage = z.infer<typeof PongMessageSchema>;
