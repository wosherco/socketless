import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import { decrement, eq, increment } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";

export class UsageManager {
  private db: DBType;
  private redis: RedisType;

  constructor(db: DBType, redis: RedisType) {
    this.db = db;
    this.redis = redis;
  }

  private async getConcurrentConnections(projectId: number): Promise<number> {
    // TODO: Should use redis
    const [connections] = await this.db
      .select({
        concurrentConnections: projectTable.concurrentConnections,
      })
      .from(projectTable)
      .where(eq(projectTable.id, projectId));

    if (!connections) {
      throw new Error("Project not found");
    }

    return connections.concurrentConnections;
  }

  public async canConnect(projectId: number): Promise<boolean> {
    const concurrentConnections =
      await this.getConcurrentConnections(projectId);

    return concurrentConnections < 100;
  }

  public async addConcurrentConnection(projectId: number) {
    await this.db
      .update(projectTable)
      .set({
        concurrentConnections: increment(projectTable.concurrentConnections),
      })
      .where(eq(projectTable.id, projectId));
  }

  public async removeConcurrentConnection(projectId: number) {
    await this.db
      .update(projectTable)
      .set({
        concurrentConnections: decrement(projectTable.concurrentConnections),
      })
      .where(eq(projectTable.id, projectId));
  }

  public async canSendMessage(projectId: number) {
    // TODO: Implement
  }
}
