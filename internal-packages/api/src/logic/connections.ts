import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import { createToken } from "@socketless/connection-tokens";
import { getMainChannelName } from "@socketless/redis";

export async function createConnection(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  const token = await createToken({ projectId, identifier });

  // TODO: Save to db

  return token;
}

export async function connectionJoinRoom(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  roomId: string,
) {
  // TODO: Save to db

  const message = {
    type: "join-room",
    data: {
      room: roomId,
    },
  } satisfies RedisMessageType;

  const res = await redis.publish(
    getMainChannelName(projectId, identifier),
    JSON.stringify(message),
  );

  const hasAnyoneReceived = res > 0;

  return hasAnyoneReceived;
}

export async function connectionLeaveRoom(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  roomId: string,
) {
  // TODO: Save to db

  const message = {
    type: "leave-room",
    data: {
      room: roomId,
    },
  } satisfies RedisMessageType;

  const res = await redis.publish(
    getMainChannelName(projectId, identifier),
    JSON.stringify(message),
  );

  const hasAnyoneReceived = res > 0;

  return hasAnyoneReceived;
  // TODO: Notify on redis or smth
}

export async function getConnectionRooms(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  // TODO: Get from db
}
