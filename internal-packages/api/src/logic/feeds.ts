import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import type {
  WebhookFeedsManageResponseType,
  WebhookMessageResponseType,
} from "@socketless/shared";
import { getFeedChannelName, getMainChannelName } from "@socketless/redis";

import {
  connectionJoinFeed,
  connectionLeaveFeed,
  connectionSetFeeds,
} from "./connections";

export async function processMessage(
  redis: RedisType,
  projectId: number,
  message: WebhookMessageResponseType,
) {
  const clients = Array.isArray(message.clients)
    ? message.clients
    : message.clients === undefined
      ? []
      : [message.clients];
  const feeds = Array.isArray(message.feeds)
    ? message.feeds
    : message.feeds === undefined
      ? []
      : [message.feeds];

  return Promise.all([
    // Send message to clients
    ...clients.map((client) =>
      redis.publish(
        getMainChannelName(projectId, client),
        JSON.stringify({
          type: "send-message",
          data: {
            // TODO: Use some sort of validator appart from only infered types
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message: message.message,
          },
        } satisfies RedisMessageType),
      ),
    ),

    // Send message to feeds
    ...feeds.map((feed) =>
      redis.publish(
        getFeedChannelName(projectId, feed),
        JSON.stringify({
          type: "send-message",
          data: {
            // TODO: Use some sort of validator appart from only infered types
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message: message.message,
          },
        } satisfies RedisMessageType),
      ),
    ),
  ]);
}

export async function processFeedAction(
  db: DBType,
  redis: RedisType,
  projectId: number,
  feedAction: WebhookFeedsManageResponseType,
) {
  const feeds = Array.isArray(feedAction.feeds)
    ? feedAction.feeds
    : [feedAction.feeds];
  const identifiers = Array.isArray(feedAction.clients)
    ? feedAction.clients
    : [feedAction.clients];

  switch (feedAction.action) {
    case "join":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionJoinFeed(db, redis, projectId, identifier, feeds),
        ),
      );
    case "set":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionSetFeeds(db, redis, projectId, identifier, feeds),
        ),
      );
    case "leave":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionLeaveFeed(db, redis, projectId, identifier, feeds),
        ),
      );
    default:
      return Promise.resolve();
  }
}

export async function processMessages(
  redis: RedisType,
  projectId: number,
  messages: WebhookMessageResponseType | WebhookMessageResponseType[],
) {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }

  return Promise.all(
    messages.map((message) => processMessage(redis, projectId, message)),
  );
}

export async function processFeedActions(
  db: DBType,
  redis: RedisType,
  projectId: number,
  feedActions:
    | WebhookFeedsManageResponseType
    | WebhookFeedsManageResponseType[],
) {
  if (!Array.isArray(feedActions)) {
    feedActions = [feedActions];
  }

  return Promise.all(
    feedActions.map((feed) => processFeedAction(db, redis, projectId, feed)),
  );
}
