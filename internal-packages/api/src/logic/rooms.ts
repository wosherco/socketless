import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import type {
  WebhookMessageResponseType,
  WebhookRoomsManageResponseType,
} from "@socketless/shared";
import { getMainChannelName, getRoomChannelName } from "@socketless/redis";

import {
  connectionJoinRoom,
  connectionLeaveRoom,
  connectionSetRooms,
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
  const rooms = Array.isArray(message.rooms)
    ? message.rooms
    : message.rooms === undefined
      ? []
      : [message.rooms];

  return Promise.all([
    // Send message to clients
    ...clients.map((client) =>
      redis.publish(
        getMainChannelName(projectId, client),
        JSON.stringify({
          type: "send-message",
          data: {
            message: message.message,
          },
        } satisfies RedisMessageType),
      ),
    ),

    // Send message to rooms
    ...rooms.map((room) =>
      redis.publish(
        getRoomChannelName(projectId, room),
        JSON.stringify({
          type: "send-message",
          data: {
            message: message.message,
          },
        } satisfies RedisMessageType),
      ),
    ),
  ]);
}

export async function processRoomAction(
  db: DBType,
  redis: RedisType,
  projectId: number,
  roomAction: WebhookRoomsManageResponseType,
) {
  const rooms = Array.isArray(roomAction.rooms)
    ? roomAction.rooms
    : [roomAction.rooms];
  const identifiers = Array.isArray(roomAction.clients)
    ? roomAction.clients
    : [roomAction.clients];

  switch (roomAction.action) {
    case "join":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionJoinRoom(db, redis, projectId, identifier, rooms),
        ),
      );
    case "set":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionSetRooms(db, redis, projectId, identifier, rooms),
        ),
      );
    case "leave":
      return Promise.all(
        identifiers.map((identifier) =>
          connectionLeaveRoom(db, redis, projectId, identifier, rooms),
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

export async function processRoomActions(
  db: DBType,
  redis: RedisType,
  projectId: number,
  roomActions:
    | WebhookRoomsManageResponseType
    | WebhookRoomsManageResponseType[],
) {
  if (!Array.isArray(roomActions)) {
    roomActions = [roomActions];
  }

  return Promise.all(
    roomActions.map((room) => processRoomAction(db, redis, projectId, room)),
  );
}
