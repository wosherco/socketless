import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type { RedisMessageType } from "@socketless/redis/schemas";
import type { SimpleWebhook } from "@socketless/shared";
import { createToken } from "@socketless/connection-tokens";
import { and, eq, inArray } from "@socketless/db";
import { connectionFeedsTable } from "@socketless/db/schema";
import { getMainChannelName } from "@socketless/redis";

export async function createConnection(
  projectId: number,
  projectClientId: string,
  identifier: string,
  feeds: string[],
  webhook?: SimpleWebhook,
) {
  const token = await createToken({
    projectId,
    clientId: projectClientId,
    identifier,
    feeds,
    webhook,
  });

  return token;
}

export async function connectionJoinFeed(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  feedNames: string[],
) {
  await db.insert(connectionFeedsTable).values(
    feedNames.map((feed) => ({
      projectId,
      identifier,
      feed,
    })),
  );

  await Promise.all(
    feedNames.map((feed) => {
      const message = {
        type: "join-feed",
        data: {
          feed,
        },
      } satisfies RedisMessageType;

      return redis.publish(
        getMainChannelName(projectId, identifier),
        JSON.stringify(message),
      );
    }),
  );
}

export async function connectionLeaveFeed(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  feedNames: string[],
) {
  await db
    .delete(connectionFeedsTable)
    .where(
      and(
        eq(connectionFeedsTable.projectId, projectId),
        eq(connectionFeedsTable.identifier, identifier),
        inArray(connectionFeedsTable.feed, feedNames),
      ),
    );
  // .returning({count: count()})

  await Promise.all(
    feedNames.map((feed) => {
      const message = {
        type: "leave-feed",
        data: {
          feed,
        },
      } satisfies RedisMessageType;

      return redis.publish(
        getMainChannelName(projectId, identifier),
        JSON.stringify(message),
      );
    }),
  );
}

export async function connectionSetFeeds(
  db: DBType,
  redis: RedisType,
  projectId: number,
  identifier: string,
  feedNames: string[],
) {
  const currentFeeds = await getConnectionFeeds(db, projectId, identifier).then(
    (feeds) => feeds.map((r) => r.feed),
  );

  const toLeave = currentFeeds.filter((feed) => !feedNames.includes(feed));
  const toJoin = feedNames.filter((feed) => !currentFeeds.includes(feed));

  await Promise.all([
    connectionJoinFeed(db, redis, projectId, identifier, toJoin),
    connectionLeaveFeed(db, redis, projectId, identifier, toLeave),
  ]);
}

export async function getConnectionFeeds(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  const channels = await db
    .select()
    .from(connectionFeedsTable)
    .where(
      and(
        eq(connectionFeedsTable.projectId, projectId),
        eq(connectionFeedsTable.identifier, identifier),
      ),
    );

  return channels;
}
