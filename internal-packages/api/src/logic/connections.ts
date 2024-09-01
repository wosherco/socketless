import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import type { SimpleWebhook } from "@socketless/validators/types";
import { createToken } from "@socketless/connection-tokens";
import { and, eq } from "@socketless/db";
import { connectionRoomsTable } from "@socketless/db/schema";
import { getMainChannelName } from "@socketless/redis";

export async function createConnection(
  projectId: number,
  projectClientId: string,
  identifier: string,
  webhook?: SimpleWebhook,
) {
  const token = await createToken({
    projectId,
    clientId: projectClientId,
    identifier,
    webhook,
  });

  return token;
}

export async function connectionJoinRoom(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  roomName: string,
) {
  await db.insert(connectionRoomsTable).values({
    projectId,
    identifier,
    room: roomName,
  });

  const message = {
    type: "join-room",
    data: {
      room: roomName,
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
  await db
    .delete(connectionRoomsTable)
    .where(
      and(
        eq(connectionRoomsTable.projectId, projectId),
        eq(connectionRoomsTable.identifier, identifier),
        eq(connectionRoomsTable.room, roomId),
      ),
    );
  // .returning({count: count()})

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
}

export async function getConnectionRooms(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  const channels = await db
    .select()
    .from(connectionRoomsTable)
    .where(
      and(
        eq(connectionRoomsTable.projectId, projectId),
        eq(connectionRoomsTable.identifier, identifier),
      ),
    );

  return channels;
}
