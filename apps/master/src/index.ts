import "./external/instrument";

import * as Sentry from "@sentry/bun";

import { eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { connectedClientsTable } from "@socketless/db/schema";
import { getHeartbeatChannelName } from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";

async function checkNode(nodeName: string) {
  console.log("Checking node", nodeName);

  const redis = createRedisClient();
  const redisPublished = createRedisClient();
  const redisChannel = getHeartbeatChannelName(nodeName);

  let isGood = false;

  // Creating listener
  await redis.subscribe(redisChannel);
  redis.on("message", (channel, message) => {
    console.log("Received message", message, "from channel", channel);

    if (message === "pong") {
      console.log(`Node ${nodeName} is responding (healthy)`);
      isGood = true;
    }
  });

  // Sending message
  await redisPublished.publish(redisChannel, "ping");

  const timeout = 10000;

  setTimeout(() => {
    if (!isGood) {
      console.error(`Node ${nodeName} is not responding`);
    }

    void redis.unsubscribe(redisChannel);
    void redis.quit();
    void redisPublished.quit();

    if (!isGood) {
      // Removing connections from database
      void db
        .delete(connectedClientsTable)
        .where(eq(connectedClientsTable.node, nodeName))
        .then(() => {
          console.log(
            `Connections for node ${nodeName} removed from the database`,
          );
        })
        .catch((error) => {
          console.error(
            `Failed to remove connections for node ${nodeName} from the database:`,
            error,
          );
        });
    }
  }, timeout);
}

async function globalCheck() {
  console.log("Checking...");

  try {
    await db
      .selectDistinctOn([connectedClientsTable.node])
      .from(connectedClientsTable);
  } catch (error) {
    console.error("Failed to fetch nodes from the database:", error);
  }

  return db
    .selectDistinct({ node: connectedClientsTable.node })
    .from(connectedClientsTable)
    .then((nodes) => {
      console.log("Checking nodes:", nodes);
      nodes.forEach((node) => void checkNode(node.node));
    })
    .catch((error) => {
      console.error("Failed to fetch nodes from the database:", error);
      Sentry.captureException(error);
    });
}

console.log("Master process started");

void globalCheck();

setInterval(() => {
  void globalCheck();
}, 15000);
