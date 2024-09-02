import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import type { SimpleWebhook } from "@socketless/shared";
import { createToken } from "@socketless/connection-tokens";
import { and, eq, inArray } from "@socketless/db";
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
  roomNames: string[],
) {
  await db.insert(connectionRoomsTable).values(
    roomNames.map((room) => ({
      projectId,
      identifier,
      room,
    })),
  );

  await Promise.all(
    roomNames.map((room) => {
      const message = {
        type: "join-room",
        data: {
          room,
        },
      } satisfies RedisMessageType;

      return redis.publish(
        getMainChannelName(projectId, identifier),
        JSON.stringify(message),
      );
    }),
  );
}

export async function connectionLeaveRoom(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  roomNames: string[],
) {
  await db
    .delete(connectionRoomsTable)
    .where(
      and(
        eq(connectionRoomsTable.projectId, projectId),
        eq(connectionRoomsTable.identifier, identifier),
        inArray(connectionRoomsTable.room, roomNames),
      ),
    );
  // .returning({count: count()})

  await Promise.all(
    roomNames.map((room) => {
      const message = {
        type: "leave-room",
        data: {
          room,
        },
      } satisfies RedisMessageType;

      return redis.publish(
        getMainChannelName(projectId, identifier),
        JSON.stringify(message),
      );
    }),
  );
}

export async function connectionSetRooms(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  roomNames: string[],
) {
  const currentRooms = await getConnectionRooms(db, projectId, identifier).then(
    (rooms) => rooms.map((r) => r.room),
  );

  const toLeave = currentRooms.filter((room) => !roomNames.includes(room));
  const toJoin = roomNames.filter((room) => !currentRooms.includes(room));

  await Promise.all([
    connectionJoinRoom(db, redis, projectId, identifier, toJoin),
    connectionLeaveRoom(db, redis, projectId, identifier, toLeave),
  ]);
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
