import type { DBType } from "@socketless/db/client";
import type { DataKeyType } from "@socketless/redis";
import type { RedisType } from "@socketless/redis/client";
import {
  getConcurrentConnections,
  getProjectIncomingMessages,
  getProjectLimits,
  getProjectOutgoingMessages,
} from "@socketless/api/logic";
import { eq } from "@socketless/db";
import { connectedClientsTable } from "@socketless/db/schema";
import {
  getProjectCountKeyname,
  getProjectLimitKeyname,
} from "@socketless/redis";

import { NODE_NAME } from "./id";

export class UsageManager {
  private db: DBType;
  private redis: RedisType;
  private projectId: number;

  constructor(db: DBType, redis: RedisType, projectId: number) {
    this.db = db;
    this.redis = redis;
    this.projectId = projectId;
  }

  public async canConnect(): Promise<boolean> {
    const [concurrentConnections, concurrentConnectionsLimit] =
      await Promise.all([
        getConcurrentConnections(this.db, this.projectId),
        this.getLimitX("concurrent"),
      ]);

    if (concurrentConnections === undefined) {
      return false;
    }

    return concurrentConnections.count < concurrentConnectionsLimit;
  }

  public async addConcurrentConnection(identifier: string) {
    const [connection] = await this.db
      .insert(connectedClientsTable)
      .values({
        identifier,
        projectId: this.projectId,
        node: NODE_NAME,
      })
      .returning({ id: connectedClientsTable.id });

    if (!connection) {
      throw new Error("Failed to add connection");
    }

    return connection;
  }

  public async removeConcurrentConnection(connectionId: number) {
    await this.db
      .delete(connectedClientsTable)
      .where(eq(connectedClientsTable.id, connectionId));
  }

  private async getLimitX(datatype: DataKeyType) {
    const limitr = await this.redis.get(
      getProjectLimitKeyname(this.projectId, datatype),
    );
    let limit = limitr === null ? null : parseInt(limitr, 10);

    if (limit === null) {
      const projectLimits = await getProjectLimits(this.db, this.projectId);

      if (projectLimits === undefined) {
        throw new Error("Failed to fetch project limits");
      }

      switch (datatype) {
        case "incoming":
          limit = projectLimits.incomingMessagesLimit;
          break;
        case "outgoing":
          limit = projectLimits.outgoingMessagesLimit;
          break;
        case "concurrent":
          limit = projectLimits.concurrentConnectionsLimit;
          break;
      }

      void Promise.all([
        this.redis.set(
          getProjectLimitKeyname(this.projectId, "incoming"),
          projectLimits.incomingMessagesLimit,
          "EX",
          60,
        ),
        this.redis.set(
          getProjectLimitKeyname(this.projectId, "outgoing"),
          projectLimits.outgoingMessagesLimit,
          "EX",
          60,
        ),
        this.redis.set(
          getProjectLimitKeyname(this.projectId, "concurrent"),
          projectLimits.concurrentConnectionsLimit,
          "EX",
          60,
        ),
      ]);
    }

    return limit;
  }

  private async canDoX(datatype: DataKeyType, increment = true) {
    const limit = await this.getLimitX(datatype);

    const countr = await this.redis.get(
      getProjectCountKeyname(this.projectId, datatype),
    );
    let count = countr === null ? null : parseInt(countr, 10);

    if (count === null) {
      let fetchFunc;
      switch (datatype) {
        case "incoming":
          fetchFunc = getProjectIncomingMessages;
          break;
        case "outgoing":
          fetchFunc = getProjectOutgoingMessages;
          break;
        case "concurrent":
          fetchFunc = getConcurrentConnections;
          break;
      }

      const fetched = await fetchFunc(this.db, this.projectId);

      if (fetched === undefined) {
        return false;
      }

      count = fetched.count;

      void this.redis.set(
        getProjectCountKeyname(this.projectId, datatype),
        count + (increment ? 1 : 0),
        "EX",
        30,
      );
    } else if (increment) {
      void this.redis.incr(getProjectCountKeyname(this.projectId, datatype));
    }

    return count < limit;
  }

  public async canSendIncomingMessage() {
    return this.canDoX("incoming");
  }

  public async canSendOutgoingMessage() {
    return this.canDoX("outgoing");
  }
}
